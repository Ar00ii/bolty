import Anthropic from '@anthropic-ai/sdk';
import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ethers } from 'ethers';

import { decryptToken } from '../../common/crypto/token-cipher.util';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { isSafeUrl } from '../../common/sanitize/sanitize.util';
import { ChartService } from '../chart/chart.service';
import { EmailService } from '../email/email.service';
import { MarketGateway } from '../market/market.gateway';
import { ReputationService } from '../reputation/reputation.service';

@Injectable()
export class ReposService {
  private readonly logger = new Logger(ReposService.name);
  private readonly anthropic: Anthropic;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly chart: ChartService,
    private readonly reputation: ReputationService,
    private readonly email: EmailService,
    @Inject(forwardRef(() => MarketGateway))
    private readonly marketGateway: MarketGateway,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY') || '',
    });
  }

  /**
   * Poll for a tx receipt, handling the common case where the buyer's wallet
   * has broadcast the tx but the Base RPC hasn't indexed it yet (receipt =
   * null). Waits up to `timeoutMs` before giving up. Fixes the "failed to
   * verify transaction" false-positive when the purchase API runs faster
   * than the block is mined.
   */
  private async waitForReceipt(
    provider: ethers.JsonRpcProvider,
    txHash: string,
    timeoutMs = 30_000,
  ): Promise<ethers.TransactionReceipt | null> {
    const deadline = Date.now() + timeoutMs;
    let delay = 1500;
    // First shot — most txs mined within ~2s on Base, so no sleep on attempt 0.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt) return receipt;
      } catch (err) {
        this.logger.warn(`receipt fetch err for ${txHash}: ${err instanceof Error ? err.message : err}`);
      }
      if (Date.now() >= deadline) return null;
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 1.5, 5000);
    }
  }

  /** Parse JSON from Claude response text */
  private parseJson(text: string): { safe: boolean; reason: string } | null {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]);
      return { safe: Boolean(parsed.safe), reason: String(parsed.reason || '') };
    } catch {
      return null;
    }
  }

  /**
   * Two-tier Claude security scan (mirrors the image):
   *  Tier 1 — Haiku: fast initial analysis
   *  Tier 2 — Sonnet: deep analysis only when Haiku flags something suspicious
   */
  private async scanRepoContent(
    name: string,
    description: string,
    topics: string[],
  ): Promise<{ safe: boolean; reason: string }> {
    const basePrompt = `You are a security moderator for a developer platform.

REJECT (safe=false) if name/description suggests:
- Malware, spyware, ransomware, keylogger, RAT
- Credential/password stealers, phishing kits
- DDoS or network attack tools
- Crypto wallet drainers or private key stealers
- Clearly illegal hacking tools targeting production systems

ACCEPT (safe=true) for: legitimate open-source projects, developer tools, bots, trading scripts, automation utilities, security research.

Name: ${name}
Description: ${description.slice(0, 500)}
Topics: ${topics.slice(0, 10).join(', ')}

Reply ONLY with JSON: {"safe": true|false, "reason": "brief reason"}`;

    try {
      // ── Tier 1: Haiku — fast scan ──────────────────────────────────────────
      const haikuRes = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{ role: 'user', content: basePrompt }],
      });
      const haikuText = (haikuRes.content[0] as { type: string; text: string }).text ?? '';
      const haikuResult = this.parseJson(haikuText);

      // If Haiku clears it → safe, no need for Sonnet
      if (haikuResult?.safe) {
        return { safe: true, reason: haikuResult.reason };
      }

      // ── Tier 2: Sonnet — deep analysis when suspicious ─────────────────────
      this.logger.warn(`Haiku flagged "${name}" — escalating to Sonnet`);
      const sonnetRes = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `${basePrompt}

NOTE: A preliminary scan flagged this as potentially suspicious. Perform a thorough analysis before making a final decision. Consider context carefully — security research and ethical hacking tools are acceptable.`,
          },
        ],
      });
      const sonnetText = (sonnetRes.content[0] as { type: string; text: string }).text ?? '';
      const sonnetResult = this.parseJson(sonnetText);
      if (sonnetResult) return sonnetResult;
    } catch (err) {
      this.logger.error('Repo content scan failed', err);
    }

    return { safe: true, reason: 'Scan unavailable — logged for manual review' };
  }

  // ── GitHub API fetch (server-side, no SSRF) ───────────────────────────────

  async fetchGitHubRepos(
    githubLogin: string,
    accessToken?: string,
    userId?: string,
  ): Promise<unknown[]> {
    // If no cookie token, try to get it from the database
    let token = accessToken;
    if (!token && userId) {
      const userRecord = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { githubToken: true },
      });
      token = decryptToken(userRecord?.githubToken) ?? undefined;
    }

    // No token at all — user connected GitHub before but token is gone, needs re-auth
    if (!token && userId) {
      this.logger.warn(`No GitHub token for user ${userId} (${githubLogin}) — need re-auth`);
      return [
        {
          _bolty_reauth: true,
          name: 'Reconecta GitHub para ver todos tus repos',
          id: -1,
          full_name: 'reauth',
          html_url: '',
          stargazers_count: 0,
          forks_count: 0,
        },
      ] as unknown[];
    }

    const cacheKey = `gh_repos:${githubLogin}:${token ? 'auth' : 'public'}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as unknown[];

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Bolty-Platform/1.0',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let allRepos: unknown[] = [];

    if (token) {
      // First: check if token has 'repo' scope by making a lightweight call
      let needsReauth = false;
      try {
        const checkResp = await axios.get('https://api.github.com/user', {
          headers,
          timeout: 10000,
        });
        const scopes = (checkResp.headers?.['x-oauth-scopes'] as string) || '';
        this.logger.log(`GitHub token scopes for ${githubLogin}: [${scopes}]`);

        if (
          !scopes
            .split(',')
            .map((s: string) => s.trim())
            .includes('repo')
        ) {
          this.logger.warn(
            `Token for ${githubLogin} lacks 'repo' scope. Revoking to force re-auth.`,
          );
          needsReauth = true;

          // Revoke the old token via GitHub API so next OAuth gives fresh scopes
          const clientId = this.config.get<string>('GITHUB_CLIENT_ID') || '';
          const clientSecret = this.config.get<string>('GITHUB_CLIENT_SECRET') || '';
          try {
            await axios.delete(`https://api.github.com/applications/${clientId}/token`, {
              auth: { username: clientId, password: clientSecret },
              data: { access_token: token },
              headers: { Accept: 'application/vnd.github.v3+json' },
              timeout: 10000,
            });
            this.logger.log(`Revoked old GitHub token for ${githubLogin}`);
          } catch (revokeErr) {
            this.logger.warn(`Failed to revoke GitHub token: ${revokeErr}`);
          }

          // Clear stored token since it's now revoked
          if (userId) {
            await this.prisma.user.update({
              where: { id: userId },
              data: { githubToken: null },
            });
          }
        }
      } catch (scopeCheckErr) {
        // Token is invalid or expired — treat as needing reauth
        this.logger.warn(`GitHub scope check failed for ${githubLogin}: ${scopeCheckErr}`);
        needsReauth = true;
        if (userId) {
          await this.prisma.user
            .update({ where: { id: userId }, data: { githubToken: null } })
            .catch(() => {});
        }
      }

      if (needsReauth) {
        // Return empty list with reauth notice — token was revoked
        return [
          {
            _bolty_reauth: true,
            name: 'Reconecta GitHub para ver todos tus repos (públicos y privados)',
            id: -1,
            full_name: 'reauth',
            html_url: '',
            stargazers_count: 0,
            forks_count: 0,
          },
        ] as unknown[];
      }

      // Token has correct scopes — fetch all repos
      let page = 1;
      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const url = `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&type=all`;
          if (!isSafeUrl(url)) throw new BadRequestException('Invalid GitHub request');

          const response = await axios.get<unknown[]>(url, { headers, timeout: 10000 });
          this.logger.log(`GitHub returned ${response.data?.length ?? 0} repos on page ${page}`);

          const batch = response.data;
          if (!batch || batch.length === 0) break;

          allRepos = allRepos.concat(batch);
          if (batch.length < 100) break;
          page++;
        }
      } catch (fetchErr) {
        this.logger.warn(`GitHub repo fetch failed for ${githubLogin}: ${fetchErr}`);
        if (userId) {
          await this.prisma.user
            .update({ where: { id: userId }, data: { githubToken: null } })
            .catch(() => {});
        }
        return [
          {
            _bolty_reauth: true,
            name: 'Reconecta GitHub para ver todos tus repos (públicos y privados)',
            id: -1,
            full_name: 'reauth',
            html_url: '',
            stargazers_count: 0,
            forks_count: 0,
          },
        ] as unknown[];
      }
    } else {
      // No token: use public API (only returns public repos)
      let page = 1;
      this.logger.warn(`No GitHub token for ${githubLogin} — falling back to public API`);
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const url = `https://api.github.com/users/${encodeURIComponent(githubLogin)}/repos?per_page=100&page=${page}&sort=updated`;
        if (!isSafeUrl(url)) throw new BadRequestException('Invalid GitHub request');

        const response = await axios.get<unknown[]>(url, { headers, timeout: 10000 });
        const batch = response.data;
        if (!batch || batch.length === 0) break;

        allRepos = allRepos.concat(batch);
        if (batch.length < 100) break;
        page++;
      }
    }

    // Cache for 5 minutes
    await this.redis.set(cacheKey, JSON.stringify(allRepos), 300);

    return allRepos;
  }

  async clearGitHubReposCache(githubLogin: string): Promise<void> {
    await Promise.all([
      this.redis.del(`gh_repos:${githubLogin}:auth`),
      this.redis.del(`gh_repos:${githubLogin}:public`),
    ]);
  }

  // ── Publish repository to platform ───────────────────────────────────────

  async publishRepository(
    userId: string,
    githubRepoData: {
      id: number;
      name: string;
      full_name: string;
      description?: string;
      language?: string;
      stargazers_count: number;
      forks_count: number;
      html_url: string;
      clone_url: string;
      topics?: string[];
      private?: boolean;
      isLocked?: boolean;
      lockedPriceUsd?: number;
      logoUrl?: string;
      websiteUrl?: string;
      twitterUrl?: string;
    },
  ) {
    const isLocked = githubRepoData.isLocked === true;

    // ── GitHub ownership verification ─────────────────────────────────────
    // Never trust the client's copy of id/full_name/stars/private — that's
    // how a user publishes someone else's repo under their own account.
    // Pull the authoritative repo metadata from the GitHub API using the
    // caller's OAuth token and require that they are the owner (or a
    // repo admin). Mass-assignable client fields are then overwritten.
    const ownerRecord = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { githubToken: true, githubLogin: true },
    });
    const token = decryptToken(ownerRecord?.githubToken) ?? undefined;
    if (!token) {
      throw new ForbiddenException('Reconnect GitHub to publish this repository');
    }
    if (!/^[\w.-]+\/[\w.-]+$/.test(githubRepoData.full_name)) {
      throw new BadRequestException('Invalid repository full name');
    }
    interface GithubRepoPayload {
      id: number;
      name: string;
      full_name: string;
      description: string | null;
      language: string | null;
      stargazers_count: number;
      forks_count: number;
      html_url: string;
      clone_url: string;
      topics: string[] | null;
      private: boolean;
      owner: { login: string };
      permissions?: { admin?: boolean };
    }
    let authoritative: GithubRepoPayload;
    try {
      const resp = await axios.get<GithubRepoPayload>(
        `https://api.github.com/repos/${githubRepoData.full_name}`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Bolty-Platform/1.0',
            Authorization: `Bearer ${token}`,
          },
          timeout: 10_000,
          validateStatus: () => true,
        },
      );
      if (resp.status === 404) {
        throw new NotFoundException('Repository not found on GitHub');
      }
      if (resp.status === 401 || resp.status === 403) {
        throw new ForbiddenException('GitHub token lacks permission for this repository');
      }
      if (resp.status !== 200 || !resp.data?.id) {
        throw new BadRequestException('Could not fetch repository metadata from GitHub');
      }
      authoritative = resp.data;
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof ForbiddenException) throw err;
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`GitHub verify failed: ${err instanceof Error ? err.message : err}`);
      throw new BadRequestException('Could not verify repository ownership with GitHub');
    }

    const isOwner =
      authoritative.owner.login.toLowerCase() === (ownerRecord?.githubLogin || '').toLowerCase();
    const isAdmin = authoritative.permissions?.admin === true;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You do not own this repository');
    }
    const isPrivate = authoritative.private;

    if (isPrivate && !isLocked) {
      throw new BadRequestException(
        'Private repositories must be published as locked with a price',
      );
    }
    if (isLocked && (!githubRepoData.lockedPriceUsd || githubRepoData.lockedPriceUsd <= 0)) {
      throw new BadRequestException('Locked repositories must have a price greater than 0');
    }

    // Validate URLs — only for public (non-private) repos since private clone URLs need auth
    if (!isPrivate) {
      if (!isSafeUrl(authoritative.html_url) || !isSafeUrl(authoritative.clone_url)) {
        throw new BadRequestException('Invalid repository URLs');
      }
    } else if (!isSafeUrl(authoritative.html_url)) {
      throw new BadRequestException('Invalid repository URL');
    }

    // AI content security scan (use authoritative name/desc/topics)
    const scan = await this.scanRepoContent(
      authoritative.name,
      authoritative.description || '',
      authoritative.topics || [],
    );
    if (!scan.safe) {
      this.logger.warn(`Repo ${authoritative.name} rejected by AI scanner: ${scan.reason}`);
      throw new ForbiddenException(`Repository rejected by security scanner: ${scan.reason}`);
    }

    // Block cross-user hijack: if another Bolty account already claimed
    // this GitHub repo id, only that owner may update it.
    const existing = await this.prisma.repository.findUnique({
      where: { githubRepoId: String(authoritative.id) },
      select: { userId: true },
    });
    if (existing && existing.userId !== userId) {
      throw new ForbiddenException('This repository is already published under another account');
    }

    const saved = await this.prisma.repository.upsert({
      where: { githubRepoId: String(authoritative.id) },
      create: {
        githubRepoId: String(authoritative.id),
        name: authoritative.name.slice(0, 100),
        fullName: authoritative.full_name.slice(0, 200),
        description: authoritative.description?.slice(0, 1000) || null,
        language: authoritative.language?.slice(0, 50) || null,
        stars: authoritative.stargazers_count,
        forks: authoritative.forks_count,
        githubUrl: authoritative.html_url,
        cloneUrl: authoritative.clone_url,
        topics: authoritative.topics || [],
        isPrivate,
        isLocked,
        lockedPriceUsd: isLocked ? githubRepoData.lockedPriceUsd : null,
        logoUrl: githubRepoData.logoUrl?.slice(0, 500) || null,
        websiteUrl: githubRepoData.websiteUrl?.slice(0, 500) || null,
        twitterUrl: githubRepoData.twitterUrl?.slice(0, 500) || null,
        userId,
      },
      update: {
        stars: authoritative.stargazers_count,
        forks: authoritative.forks_count,
        description: authoritative.description?.slice(0, 1000) || null,
        isLocked,
        lockedPriceUsd: isLocked ? githubRepoData.lockedPriceUsd : null,
        logoUrl: githubRepoData.logoUrl?.slice(0, 500) || null,
        websiteUrl: githubRepoData.websiteUrl?.slice(0, 500) || null,
        twitterUrl: githubRepoData.twitterUrl?.slice(0, 500) || null,
      },
    });

    // Only award reputation on first-time publish (not on update).
    if (!existing) {
      this.reputation
        .awardPoints(userId, 'REPO_PUBLISHED', saved.id, saved.fullName)
        .catch((err) =>
          this.logger.warn(
            `Reputation award failed for repo ${saved.id}: ${err instanceof Error ? err.message : err}`,
          ),
        );
    }

    return saved;
  }

  // ── List platform repositories ────────────────────────────────────────────

  async listRepositories(params: {
    page?: number;
    limit?: number;
    language?: string;
    search?: string;
    sortBy?: 'votes' | 'stars' | 'recent' | 'downloads';
  }) {
    const { page = 1, limit = 20, language, search, sortBy = 'recent' } = params;
    const skip = (page - 1) * Math.min(limit, 50);
    const take = Math.min(limit, 50);

    const where: Record<string, unknown> = {
      // Show public repos OR locked repos (private locked repos are visible but content is hidden)
      OR: [{ isPrivate: false }, { isLocked: true }],
      ...(language ? { language: { equals: language, mode: 'insensitive' as const } } : {}),
      ...(search
        ? {
            AND: [
              {
                OR: [
                  { name: { contains: search, mode: 'insensitive' as const } },
                  { description: { contains: search, mode: 'insensitive' as const } },
                ],
              },
            ],
          }
        : {}),
    };

    const orderBy =
      sortBy === 'stars'
        ? { stars: 'desc' as const }
        : sortBy === 'downloads'
          ? { downloadCount: 'desc' as const }
          : { createdAt: 'desc' as const };

    const [repos, total] = await Promise.all([
      this.prisma.repository.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: { select: { username: true, avatarUrl: true } },
          _count: { select: { votes: true } },
        },
      }),
      this.prisma.repository.count({ where }),
    ]);

    // Vote tallies in ONE groupBy across the page instead of one query per row.
    // Was 1 + N queries (~20 round-trips per /repos page); now 2.
    const repoIds = repos.map((r) => r.id);
    const voteAgg = repoIds.length
      ? await this.prisma.vote.groupBy({
          by: ['repositoryId', 'value'],
          where: { repositoryId: { in: repoIds } },
          _count: { _all: true },
        })
      : [];

    const tally = new Map<string, { up: number; down: number }>();
    for (const row of voteAgg) {
      const t = tally.get(row.repositoryId) ?? { up: 0, down: 0 };
      if (row.value === 'UP') t.up = row._count._all;
      else if (row.value === 'DOWN') t.down = row._count._all;
      tally.set(row.repositoryId, t);
    }

    const reposWithVotes = repos.map((repo) => {
      const t = tally.get(repo.id) ?? { up: 0, down: 0 };
      return { ...repo, upvotes: t.up, downvotes: t.down, score: t.up - t.down };
    });

    if (sortBy === 'votes') {
      reposWithVotes.sort((a, b) => b.score - a.score);
    }

    return {
      data: reposWithVotes,
      meta: { total, page, limit: take, pages: Math.ceil(total / take) },
    };
  }

  // ── Voting ────────────────────────────────────────────────────────────────

  async vote(userId: string, repositoryId: string, value: 'UP' | 'DOWN') {
    const repo = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
    });
    if (!repo) throw new NotFoundException('Repository not found');

    // Prevent voting on own repos
    if (repo.userId === userId) {
      throw new ForbiddenException('Cannot vote on your own repository');
    }

    // Vote rate limiting
    const rateKey = `vote_rate:${userId}`;
    const count = await this.redis.incr(rateKey);
    if (count === 1) await this.redis.expire(rateKey, 3600); // 1 hour
    if (count > 50) throw new ForbiddenException('Vote rate limit exceeded');

    // Upsert vote (one vote per user per repo)
    return this.prisma.vote.upsert({
      where: { userId_repositoryId: { userId, repositoryId } },
      create: { userId, repositoryId, value },
      update: { value },
    });
  }

  async removeVote(userId: string, repositoryId: string) {
    await this.prisma.vote.deleteMany({
      where: { userId, repositoryId },
    });
  }

  // ── Download tracking ─────────────────────────────────────────────────────

  async trackDownload(repositoryId: string, userId: string) {
    const repo = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
      select: { cloneUrl: true, githubUrl: true, isLocked: true, userId: true },
    });
    if (!repo) throw new NotFoundException('Repository not found');

    // Validate URL before returning it
    if (!isSafeUrl(repo.githubUrl)) {
      throw new BadRequestException('Invalid repository URL');
    }

    // Locked repos: only the owner OR a paying buyer gets the download URL.
    // Owners always have access to their own content — without this the owner
    // can't pull their own repo back after locking it.
    if (repo.isLocked && repo.userId !== userId) {
      const purchase = await this.prisma.repoPurchase.findFirst({
        where: { buyerId: userId, repositoryId, verified: true },
        select: { id: true },
      });
      if (!purchase) {
        throw new ForbiddenException('Purchase required to download this repository');
      }
    }

    // Dedupe metric inflation: one download counted per user per 24h.
    // Otherwise a single account can loop this endpoint to game rankings.
    const dedupKey = `repo_dl:${repositoryId}:${userId}`;
    const seen = await this.redis.get(dedupKey);
    if (!seen) {
      await this.redis.set(dedupKey, '1', 86_400);
      await this.prisma.repository.update({
        where: { id: repositoryId },
        data: { downloadCount: { increment: 1 } },
      });
    }

    return { downloadUrl: repo.githubUrl + '/archive/refs/heads/main.zip' };
  }

  async getRepository(id: string, userId?: string) {
    const repo = await this.prisma.repository.findUnique({
      where: { id },
      include: {
        user: {
          select: { username: true, displayName: true, avatarUrl: true, walletAddress: true },
        },
        votes: userId ? { where: { userId } } : false,
        _count: { select: { votes: true } },
      },
    });
    if (!repo) throw new NotFoundException('Repository not found');
    return repo;
  }

  // ── Purchase (locked repos) ────────────────────────────────────────────────

  async purchaseRepository(
    buyerId: string,
    repoId: string,
    txHash: string,
    platformFeeTxHash?: string,
    consentSignature?: string,
    consentMessage?: string,
  ) {
    const repo = await this.prisma.repository.findUnique({
      where: { id: repoId },
      include: { user: { select: { id: true, walletAddress: true } } },
    });

    if (!repo) throw new NotFoundException('Repository not found');
    if (!repo.isLocked) throw new BadRequestException('Repository is not locked');
    if (repo.userId === buyerId)
      throw new ForbiddenException('Cannot purchase your own repository');

    // Check if already purchased
    const existing = await this.prisma.repoPurchase.findFirst({
      where: { buyerId, repositoryId: repoId, verified: true },
    });
    if (existing) throw new ConflictException('Already purchased');

    const sellerWallet = repo.user.walletAddress;
    if (!sellerWallet) {
      throw new BadRequestException('Seller has no wallet address configured');
    }

    if (!(repo.lockedPriceUsd && repo.lockedPriceUsd > 0)) {
      throw new BadRequestException('Repository price is not set');
    }

    // ── Persist the attempt FIRST ────────────────────────────────────────
    // Guarantee a row exists for this txHash so the buyer's payment is
    // always captured — even if the on-chain verification below fails or
    // times out. A stuck verification must never make a confirmed payment
    // vanish from the buyer's library / orders.
    const pending = await this.prisma.repoPurchase.upsert({
      where: { txHash },
      create: {
        txHash,
        buyerId,
        repositoryId: repoId,
        amountWei: '0',
        verified: false,
        platformFeeTxHash: platformFeeTxHash || null,
        consentSignature: consentSignature || null,
        consentMessage: consentMessage || null,
      },
      update: {},
    });
    // If this txHash was submitted by a different buyer or for a different
    // repo, refuse — the unique txHash is one-to-one with a payment.
    if (pending.buyerId !== buyerId || pending.repositoryId !== repoId) {
      throw new BadRequestException('Transaction hash already linked to another purchase');
    }
    // If we already verified this exact tx (retry after success), short-circuit.
    if (pending.verified) {
      return {
        success: true,
        purchaseId: pending.id,
        downloadUrl: repo.githubUrl + '/archive/refs/heads/main.zip',
      };
    }

    // ── Expected payment amount ──────────────────────────────────────────
    // Repo prices are quoted in USD (`lockedPriceUsd`). Convert to wei via
    // the live ETH/USD oracle so an attacker can't pay dust for a $1k repo.
    const ethPrice = await this.chart.getEthPrice().catch(() => null);
    if (!ethPrice || !(ethPrice.price > 0)) {
      throw new BadRequestException('Price oracle unavailable, try again shortly');
    }
    // Allow 5% slippage between quote and confirmation — ETH can move a
    // couple percent while MetaMask is open and the old 3% window was
    // rejecting real payments after tiny oracle drifts.
    const minEth = (repo.lockedPriceUsd / ethPrice.price) * 0.95;
    let expectedTotalWei: bigint;
    try {
      expectedTotalWei = ethers.parseEther(minEth.toFixed(18));
    } catch {
      throw new BadRequestException('Repository price is not representable on-chain');
    }
    // Base network dual-fee model:
    //   - ETH payment   → 7% platform fee (93% to seller).
    //   - BOLTY payment → 3% platform fee (97% to seller; we incentivize BOLTY).
    const tokenContractCfg = this.config.get<string>('BOLTY_TOKEN_CONTRACT', '');
    const isBoltyPath = !!tokenContractCfg;
    const feeBps = isBoltyPath ? 300n : 700n;
    const expectedSellerWei = (expectedTotalWei * (10000n - feeBps)) / 10000n;
    const expectedPlatformFeeWei = (expectedTotalWei * feeBps) / 10000n;

    // ── Consent signature verification ────────────────────────────────────
    if (consentSignature && consentMessage) {
      try {
        const signerAddress = ethers.verifyMessage(consentMessage, consentSignature);
        const buyer = await this.prisma.user.findUnique({
          where: { id: buyerId },
          select: { walletAddress: true },
        });
        if (
          !buyer?.walletAddress ||
          signerAddress.toLowerCase() !== buyer.walletAddress.toLowerCase()
        ) {
          throw new BadRequestException('Consent signature does not match buyer wallet');
        }
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException('Invalid consent signature');
      }
    }

    // ── On-chain verification (Base network, chainId 8453) ─────────────────
    const rpcUrl = this.config.get<string>('ETH_RPC_URL', 'https://mainnet.base.org');
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const tokenContract = tokenContractCfg;

    let amountWei = '0';

    try {
      // Retry the receipt up to 30s — on Base most txs mine in ~2s but the
      // frontend sometimes calls /purchase a beat too early.
      const receipt = await this.waitForReceipt(provider, txHash, 30_000);

      if (!receipt) {
        throw new BadRequestException(
          'Transaction is still pending — wait a few seconds and try again',
        );
      }
      if (receipt.status !== 1) {
        throw new BadRequestException('Transaction reverted on-chain');
      }

      if (tokenContract) {
        // ERC-20 token payment — check Transfer event
        const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        const transferLog = receipt.logs.find(
          (log) =>
            log.address.toLowerCase() === tokenContract.toLowerCase() &&
            log.topics[0] === TRANSFER_TOPIC &&
            log.topics[2] &&
            '0x' + log.topics[2].slice(26).toLowerCase() === sellerWallet.toLowerCase(),
        );
        if (!transferLog) throw new BadRequestException('No valid token transfer found');
        const paid = BigInt(transferLog.data);
        if (paid < expectedSellerWei) {
          throw new BadRequestException(
            `Paid amount (${paid.toString()}) is below expected price (${expectedSellerWei.toString()})`,
          );
        }
        amountWei = paid.toString();
      } else {
        const tx = await provider.getTransaction(txHash);
        if (!tx) throw new BadRequestException('Transaction not found');
        if (tx.to?.toLowerCase() !== sellerWallet.toLowerCase()) {
          throw new BadRequestException('Transaction recipient does not match seller');
        }
        if (BigInt(tx.value) < expectedSellerWei) {
          throw new BadRequestException(
            `Paid amount (${tx.value.toString()} wei) is below expected price (${expectedSellerWei.toString()} wei)`,
          );
        }
        amountWei = tx.value.toString();
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Purchase verification error: ${err instanceof Error ? err.message : err}`);
      throw new BadRequestException('Could not verify transaction on-chain');
    }

    // ── Platform commission verification (7% ETH / 3% BOLTY on Base) ──────
    const platformWallet = this.config.get<string>('PLATFORM_WALLET', '');
    let platformFeeWei = '0';

    if (platformWallet && platformFeeTxHash) {
      try {
        const [feeReceipt, feeTx] = await Promise.all([
          this.waitForReceipt(provider, platformFeeTxHash, 30_000),
          provider.getTransaction(platformFeeTxHash),
        ]);

        if (!feeReceipt) {
          throw new BadRequestException('Platform fee transaction still pending — retry shortly');
        }
        if (feeReceipt.status !== 1) {
          throw new BadRequestException('Platform fee transaction reverted');
        }
        if (!feeTx || feeTx.to?.toLowerCase() !== platformWallet.toLowerCase()) {
          throw new BadRequestException('Platform fee recipient does not match Bolty wallet');
        }
        if (BigInt(feeTx.value) < expectedPlatformFeeWei) {
          throw new BadRequestException(
            `Platform fee (${feeTx.value.toString()} wei) is below expected (${expectedPlatformFeeWei.toString()} wei)`,
          );
        }
        platformFeeWei = feeTx.value.toString();
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        this.logger.error(
          `Platform fee verification error: ${err instanceof Error ? err.message : err}`,
        );
        throw new BadRequestException('Could not verify platform fee transaction');
      }
    }

    // Upgrade the pending row to verified.
    const purchase = await this.prisma.repoPurchase.update({
      where: { id: pending.id },
      data: {
        verified: true,
        amountWei,
        platformFeeWei: platformFeeWei || null,
      },
    });

    // Broadcast to the live market feed so the public trade ticker /
    // recent-sales panels pick it up alongside agent/listing purchases.
    try {
      const [buyerUser, sellerUser] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: buyerId },
          select: { id: true, username: true, avatarUrl: true },
        }),
        this.prisma.user.findUnique({
          where: { id: repo.userId },
          select: { id: true, username: true },
        }),
      ]);
      const eth = amountWei ? Number(amountWei) / 1e18 : null;
      this.marketGateway.emitSale({
        listingId: repo.id,
        listingTitle: repo.name,
        listingType: 'REPO',
        amountWei: amountWei ?? '0',
        priceEth: eth !== null && Number.isFinite(eth) ? Number(eth.toFixed(6)) : null,
        currency: isBoltyPath ? 'BOLTY' : 'ETH',
        buyer: buyerUser ?? { id: buyerId, username: null, avatarUrl: null },
        seller: sellerUser ?? { id: repo.userId, username: null },
        createdAt: purchase.createdAt.toISOString(),
      });
    } catch (err) {
      this.logger.warn(
        `Failed to broadcast repo sale event: ${err instanceof Error ? err.message : err}`,
      );
    }

    // Reputation: award the seller for a confirmed repo sale. FIRST_SALE
    // lifetime bonus if this is their very first verified sale across any
    // surface (market listings + repo purchases counted together).
    try {
      const [priorMarketSales, priorRepoSales] = await Promise.all([
        this.prisma.marketPurchase.count({
          where: { sellerId: repo.userId, verified: true },
        }),
        this.prisma.repoPurchase.count({
          where: { verified: true, repository: { userId: repo.userId }, id: { not: purchase.id } },
        }),
      ]);
      const reason = priorMarketSales + priorRepoSales === 0 ? 'FIRST_SALE' : 'REPO_SOLD';
      this.reputation
        .awardPoints(repo.userId, reason, purchase.id, repo.name)
        .catch((err) =>
          this.logger.warn(
            `Reputation award failed for repo sale ${purchase.id}: ${err instanceof Error ? err.message : err}`,
          ),
        );
    } catch (err) {
      this.logger.warn(
        `Reputation award skipped for repo sale ${purchase.id}: ${err instanceof Error ? err.message : err}`,
      );
    }

    // Purchase confirmation emails (fire-and-forget)
    (async () => {
      try {
        const parties = await this.prisma.user.findMany({
          where: { id: { in: [buyerId, repo.userId] } },
          select: {
            id: true,
            email: true,
            username: true,
            notificationPreference: { select: { emailOrderUpdates: true } },
          },
        });
        const buyerRec = parties.find((p) => p.id === buyerId);
        const sellerRec = parties.find((p) => p.id === repo.userId);
        const currency = isBoltyPath ? 'BOLTY' : 'ETH';
        const amount = amountWei ? Number(amountWei) / 1e18 : 0;
        const amountLabel = Number.isFinite(amount) && amount > 0
          ? `${amount.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')} ${currency}`
          : `$${repo.lockedPriceUsd ?? 0}`;
        const payload = {
          buyerUsername: buyerRec?.username || 'buyer',
          sellerUsername: sellerRec?.username || 'seller',
          listingTitle: repo.name,
          orderId: purchase.id,
          amountLabel,
          txHash: purchase.txHash,
          purchaseKind: 'repo' as const,
        };
        const buyerOptIn = buyerRec?.notificationPreference?.emailOrderUpdates !== false;
        const sellerOptIn = sellerRec?.notificationPreference?.emailOrderUpdates !== false;
        if (buyerRec?.email && buyerOptIn) {
          await this.email.sendPurchaseConfirmation(buyerRec.email, 'buyer', payload);
        }
        if (sellerRec?.email && sellerOptIn) {
          await this.email.sendPurchaseConfirmation(sellerRec.email, 'seller', payload);
        }
      } catch (err) {
        this.logger.warn(
          `Repo purchase email failed for ${purchase.id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    })();

    return {
      success: true,
      purchaseId: purchase.id,
      downloadUrl: repo.githubUrl + '/archive/refs/heads/main.zip',
    };
  }

  async checkPurchased(userId: string, repoId: string) {
    const purchase = await this.prisma.repoPurchase.findFirst({
      where: { buyerId: userId, repositoryId: repoId, verified: true },
    });
    return { purchased: !!purchase };
  }

  // ── Collaborators ──────────────────────────────────────────────────────────

  async getCollaborators(repoId: string) {
    const repo = await this.prisma.repository.findUnique({ where: { id: repoId } });
    if (!repo) throw new NotFoundException('Repository not found');

    return this.prisma.repoCollaborator.findMany({
      where: { repositoryId: repoId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            reputationPoints: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addCollaborator(
    requestingUserId: string,
    repoId: string,
    data: { targetUserId?: string; name?: string; type?: string; url?: string; role?: string },
  ) {
    const repo = await this.prisma.repository.findUnique({ where: { id: repoId } });
    if (!repo) throw new NotFoundException('Repository not found');
    if (repo.userId !== requestingUserId) {
      throw new ForbiddenException('Only the repository owner can add collaborators');
    }

    const count = await this.prisma.repoCollaborator.count({ where: { repositoryId: repoId } });
    if (count >= 10) throw new BadRequestException('Maximum 10 collaborators per repository');

    const validTypes = ['USER', 'AI_AGENT', 'PROGRAM'];
    const type = data.type && validTypes.includes(data.type) ? data.type : 'USER';

    // If adding a user collaborator by ID, look them up
    if (data.targetUserId) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: data.targetUserId },
        select: { id: true, username: true, displayName: true },
      });
      if (!targetUser) throw new NotFoundException('User not found');
      if (targetUser.id === requestingUserId) {
        throw new BadRequestException('Cannot add yourself as a collaborator');
      }

      // Check unique constraint
      const exists = await this.prisma.repoCollaborator.findUnique({
        where: { repositoryId_userId: { repositoryId: repoId, userId: data.targetUserId } },
      });
      if (exists) throw new ConflictException('User is already a collaborator');

      return this.prisma.repoCollaborator.create({
        data: {
          repositoryId: repoId,
          userId: data.targetUserId,
          name: targetUser.displayName || targetUser.username || 'Unknown',
          type: 'USER',
          role: data.role?.slice(0, 80) || null,
          url: null,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              reputationPoints: true,
            },
          },
        },
      });
    }

    // Non-user collaborator (AI_AGENT or PROGRAM)
    if (!data.name || data.name.trim().length < 2) {
      throw new BadRequestException('Collaborator name is required');
    }

    return this.prisma.repoCollaborator.create({
      data: {
        repositoryId: repoId,
        userId: null,
        name: data.name.slice(0, 80),
        type: type as unknown as any,
        role: data.role?.slice(0, 80) || null,
        url: data.url?.slice(0, 500) || null,
      },
    });
  }

  async removeCollaborator(requestingUserId: string, repoId: string, collaboratorId: string) {
    const repo = await this.prisma.repository.findUnique({ where: { id: repoId } });
    if (!repo) throw new NotFoundException('Repository not found');
    if (repo.userId !== requestingUserId) {
      throw new ForbiddenException('Only the repository owner can remove collaborators');
    }

    const collaborator = await this.prisma.repoCollaborator.findUnique({
      where: { id: collaboratorId },
    });
    if (!collaborator || collaborator.repositoryId !== repoId) {
      throw new NotFoundException('Collaborator not found');
    }

    await this.prisma.repoCollaborator.delete({ where: { id: collaboratorId } });
    return { success: true };
  }

  async deleteRepository(userId: string, repoId: string) {
    const repo = await this.prisma.repository.findUnique({ where: { id: repoId } });
    if (!repo) throw new NotFoundException('Repository not found');
    if (repo.userId !== userId) throw new ForbiddenException('Not your repository');
    await this.prisma.repository.delete({ where: { id: repoId } });
    return { success: true };
  }
}
