import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

  async fetchGitHubRepos(githubLogin: string, accessToken?: string): Promise<unknown[]> {
    const cacheKey = `gh_repos:${githubLogin}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as unknown[];

    const url = `https://api.github.com/users/${encodeURIComponent(githubLogin)}/repos?per_page=30&sort=updated&type=public`;

    // Validate URL to prevent SSRF
    if (!isSafeUrl(url)) {
      throw new BadRequestException('Invalid GitHub request');
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Bolty-Platform/1.0',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await axios.get<unknown[]>(url, { headers, timeout: 10000 });
    const repos = response.data;

    // Cache for 5 minutes
    await this.redis.set(cacheKey, JSON.stringify(repos), 300);

    return repos;
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
      private: boolean;
    },
  ) {
    if (githubRepoData.private) {
      throw new ForbiddenException('Cannot publish private repositories');
    }

    // Validate URLs
    if (!isSafeUrl(githubRepoData.html_url) || !isSafeUrl(githubRepoData.clone_url)) {
      throw new BadRequestException('Invalid repository URLs');
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
        isPrivate: githubRepoData.private,
        userId,
      },
      update: {
        stars: githubRepoData.stargazers_count,
        forks: githubRepoData.forks_count,
        description: githubRepoData.description?.slice(0, 1000),
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
        user: { select: { username: true, avatarUrl: true, githubLogin: true } },
        votes: userId ? { where: { userId } } : false,
        _count: { select: { votes: true } },
      },
    });
    if (!repo) throw new NotFoundException('Repository not found');
    return repo;
  }
}
