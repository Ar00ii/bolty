import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ethers } from 'ethers';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { isSafeUrl } from '../../common/sanitize/sanitize.util';
import axios from 'axios';

@Injectable()
export class ReposService {
  private readonly logger = new Logger(ReposService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    this.genAI = new GoogleGenerativeAI(this.config.get<string>('GEMINI_API_KEY') || '');
  }

  /** AI security scan for repo name + description */
  private async scanRepoContent(
    name: string,
    description: string,
    topics: string[],
  ): Promise<{ safe: boolean; reason: string }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `You are a security moderator for a developer platform.

REJECT (safe=false) if name/description suggests:
- Malware, spyware, ransomware, keylogger, RAT
- Credential/password stealers, phishing kits
- DDoS or network attack tools
- Crypto wallet drainers or private key stealers
- Clearly illegal services or hacking tools targeting production systems

ACCEPT (safe=true) for: legitimate open-source projects, developer tools, bots, trading scripts, automation utilities, security research.

Name: ${name}
Description: ${description.slice(0, 500)}
Topics: ${topics.slice(0, 10).join(', ')}

Reply ONLY with JSON: {"safe": true|false, "reason": "brief reason"}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return { safe: Boolean(parsed.safe), reason: String(parsed.reason || '') };
      }
    } catch (err) {
      this.logger.error('Repo content scan failed', err);
    }
    return { safe: true, reason: 'Scan unavailable — logged for manual review' };
  }

  // ── GitHub API fetch (server-side, no SSRF) ───────────────────────────────

  async fetchGitHubRepos(githubLogin: string, accessToken?: string, userId?: string): Promise<unknown[]> {
    // If no cookie token, try to get it from the database
    let token = accessToken;
    if (!token && userId) {
      const userRecord = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { githubToken: true },
      });
      token = userRecord?.githubToken ?? undefined;
    }

    // No token at all — user connected GitHub before but token is gone, needs re-auth
    if (!token && userId) {
      this.logger.warn(`No GitHub token for user ${userId} (${githubLogin}) — need re-auth`);
      return [{
        _bolty_reauth: true,
        name: 'Reconecta GitHub para ver todos tus repos',
        id: -1,
        full_name: 'reauth',
        html_url: '',
        stargazers_count: 0,
        forks_count: 0,
      }] as unknown[];
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

        if (!scopes.split(',').map((s: string) => s.trim()).includes('repo')) {
          this.logger.warn(`Token for ${githubLogin} lacks 'repo' scope. Revoking to force re-auth.`);
          needsReauth = true;

          // Revoke the old token via GitHub API so next OAuth gives fresh scopes
          const clientId = this.config.get<string>('GITHUB_CLIENT_ID') || 'Ov23liO79MvZtWDEdy2a';
          const clientSecret = this.config.get<string>('GITHUB_CLIENT_SECRET') || 'b9e08f25b6e46d0b012e7be6183e38bb0d43d662';
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
      } catch {
        // Token might be invalid, continue with what we can get
      }

      if (needsReauth) {
        // Return empty list with reauth notice — token was revoked
        return [{
          _bolty_reauth: true,
          name: 'Reconecta GitHub para ver todos tus repos (públicos y privados)',
          id: -1,
          full_name: 'reauth',
          html_url: '',
          stargazers_count: 0,
          forks_count: 0,
        }] as unknown[];
      }

      // Token has correct scopes — fetch all repos
      let page = 1;
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
    } else {
      // No token: use public API (only returns public repos)
      let page = 1;
      this.logger.warn(`No GitHub token for ${githubLogin} — falling back to public API`);
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
    },
  ) {
    const isPrivate = githubRepoData.private === true;
    const isLocked = githubRepoData.isLocked === true;

    // Private repos must be locked with a price
    if (isPrivate && !isLocked) {
      throw new BadRequestException('Private repositories must be published as locked with a price');
    }
    if (isLocked && (!githubRepoData.lockedPriceUsd || githubRepoData.lockedPriceUsd <= 0)) {
      throw new BadRequestException('Locked repositories must have a price greater than 0');
    }

    // Validate URLs — only for public (non-private) repos since private clone URLs need auth
    if (!isPrivate) {
      if (!isSafeUrl(githubRepoData.html_url) || !isSafeUrl(githubRepoData.clone_url)) {
        throw new BadRequestException('Invalid repository URLs');
      }
    } else if (!isSafeUrl(githubRepoData.html_url)) {
      throw new BadRequestException('Invalid repository URL');
    }

    // AI content security scan
    const scan = await this.scanRepoContent(
      githubRepoData.name,
      githubRepoData.description || '',
      githubRepoData.topics || [],
    );
    if (!scan.safe) {
      this.logger.warn(`Repo ${githubRepoData.name} rejected by AI scanner: ${scan.reason}`);
      throw new ForbiddenException(`Repository rejected by security scanner: ${scan.reason}`);
    }

    return this.prisma.repository.upsert({
      where: { githubRepoId: String(githubRepoData.id) },
      create: {
        githubRepoId: String(githubRepoData.id),
        name: githubRepoData.name.slice(0, 100),
        fullName: githubRepoData.full_name.slice(0, 200),
        description: githubRepoData.description?.slice(0, 1000),
        language: githubRepoData.language?.slice(0, 50),
        stars: githubRepoData.stargazers_count,
        forks: githubRepoData.forks_count,
        githubUrl: githubRepoData.html_url,
        cloneUrl: githubRepoData.clone_url,
        topics: githubRepoData.topics || [],
        isPrivate,
        isLocked,
        lockedPriceUsd: isLocked ? githubRepoData.lockedPriceUsd : null,
        userId,
      },
      update: {
        stars: githubRepoData.stargazers_count,
        forks: githubRepoData.forks_count,
        description: githubRepoData.description?.slice(0, 1000),
        isLocked,
        lockedPriceUsd: isLocked ? githubRepoData.lockedPriceUsd : null,
      },
    });
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

    const where = {
      isPrivate: false,
      ...(language ? { language: { equals: language, mode: 'insensitive' as const } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
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

    // Calculate vote scores
    const reposWithVotes = await Promise.all(
      repos.map(async (repo) => {
        const votes = await this.prisma.vote.groupBy({
          by: ['value'],
          where: { repositoryId: repo.id },
          _count: true,
        });
        const upvotes = votes.find((v) => v.value === 'UP')?._count ?? 0;
        const downvotes = votes.find((v) => v.value === 'DOWN')?._count ?? 0;
        return { ...repo, upvotes, downvotes, score: upvotes - downvotes };
      }),
    );

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

  async trackDownload(repositoryId: string) {
    const repo = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
      select: { cloneUrl: true, githubUrl: true },
    });
    if (!repo) throw new NotFoundException('Repository not found');

    // Validate URL before returning it
    if (!isSafeUrl(repo.githubUrl)) {
      throw new BadRequestException('Invalid repository URL');
    }

    await this.prisma.repository.update({
      where: { id: repositoryId },
      data: { downloadCount: { increment: 1 } },
    });

    return { downloadUrl: repo.githubUrl + '/archive/refs/heads/main.zip' };
  }

  async getRepository(id: string, userId?: string) {
    const repo = await this.prisma.repository.findUnique({
      where: { id },
      include: {
        user: { select: { username: true, displayName: true, avatarUrl: true, walletAddress: true } },
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
    if (repo.userId === buyerId) throw new ForbiddenException('Cannot purchase your own repository');

    // Check if already purchased
    const existing = await this.prisma.repoPurchase.findFirst({
      where: { buyerId, repositoryId: repoId, verified: true },
    });
    if (existing) throw new ConflictException('Already purchased');

    const sellerWallet = repo.user.walletAddress;
    if (!sellerWallet) {
      throw new BadRequestException('Seller has no wallet address configured');
    }

    // ── Consent signature verification ────────────────────────────────────
    if (consentSignature && consentMessage) {
      try {
        const signerAddress = ethers.verifyMessage(consentMessage, consentSignature);
        const buyer = await this.prisma.user.findUnique({
          where: { id: buyerId },
          select: { walletAddress: true },
        });
        if (!buyer?.walletAddress || signerAddress.toLowerCase() !== buyer.walletAddress.toLowerCase()) {
          throw new BadRequestException('Consent signature does not match buyer wallet');
        }
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException('Invalid consent signature');
      }
    }

    // ── On-chain verification ──────────────────────────────────────────────
    const rpcUrl = this.config.get<string>('ETH_RPC_URL', 'https://eth.llamarpc.com');
    const tokenContract = this.config.get<string>('BOLTY_TOKEN_CONTRACT', '');

    let verified = false;
    let amountWei = '0';

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt || receipt.status !== 1) {
        throw new BadRequestException('Transaction failed or not found');
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
        amountWei = BigInt(transferLog.data).toString();
        verified = true;
      } else {
        // ETH payment — check direct transfer
        const tx = await provider.getTransaction(txHash);
        if (!tx) throw new BadRequestException('Transaction not found');
        if (tx.to?.toLowerCase() !== sellerWallet.toLowerCase()) {
          throw new BadRequestException('Transaction recipient does not match seller');
        }
        amountWei = tx.value.toString();
        verified = true;
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Purchase verification error: ${err instanceof Error ? err.message : err}`);
      throw new BadRequestException('Could not verify transaction on-chain');
    }

    // ── Platform commission verification (2.5%) ───────────────────────────
    const platformWallet = this.config.get<string>('PLATFORM_WALLET', '');
    let platformFeeWei = '0';

    if (platformWallet && platformFeeTxHash) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const feeReceipt = await provider.getTransactionReceipt(platformFeeTxHash);
        const feeTx = await provider.getTransaction(platformFeeTxHash);

        if (!feeReceipt || feeReceipt.status !== 1) {
          throw new BadRequestException('Platform fee transaction failed or not found');
        }
        if (!feeTx || feeTx.to?.toLowerCase() !== platformWallet.toLowerCase()) {
          throw new BadRequestException('Platform fee recipient does not match Bolty wallet');
        }
        platformFeeWei = feeTx.value.toString();
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        this.logger.error(`Platform fee verification error: ${err instanceof Error ? err.message : err}`);
        throw new BadRequestException('Could not verify platform fee transaction');
      }
    }

    const purchase = await this.prisma.repoPurchase.create({
      data: {
        txHash,
        buyerId,
        repositoryId: repoId,
        amountWei,
        verified,
        platformFeeTxHash: platformFeeTxHash || null,
        platformFeeWei: platformFeeWei || null,
        consentSignature: consentSignature || null,
        consentMessage: consentMessage || null,
      },
    });

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
}
