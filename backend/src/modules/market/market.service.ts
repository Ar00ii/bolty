import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../../common/prisma/prisma.service';
import { sanitizeText, isSafeUrl } from '../../common/sanitize/sanitize.util';

interface CreateListingDto {
  title: string;
  description: string;
  type: 'REPO' | 'BOT' | 'SCRIPT' | 'AI_AGENT' | 'OTHER';
  price: number;
  currency?: string;
  tags?: string[];
  repositoryId?: string;
  agentUrl?: string;
  agentEndpoint?: string;
  fileKey?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
}

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('GEMINI_API_KEY') || '';
    this.genAI = new GoogleGenerativeAI(key);
  }

  /** AI-powered content security scan — returns { safe, reason } */
  async scanContent(title: string, description: string): Promise<{ safe: boolean; reason: string }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `You are a content safety moderator for a developer marketplace.
Analyze the following listing and determine if it is safe and legitimate.

REJECT if it contains:
- Malware, spyware, ransomware, trojans, keyloggers
- Phishing tools, credential stealers
- DDoS / network attack tools
- Crypto drainers or wallet stealers
- Illegal hacking tools or exploits for production systems
- Scams or fraudulent services
- Adult or illegal content

ACCEPT if it is:
- A legitimate code repository, bot, or script
- A developer tool, automation script, or utility
- Trading bots, monitoring tools, analytics

Title: ${title.slice(0, 200)}
Description: ${description.slice(0, 1000)}

Respond with ONLY a JSON object: {"safe": true|false, "reason": "one sentence explanation"}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { safe: Boolean(parsed.safe), reason: String(parsed.reason || '') };
      }
    } catch (err) {
      this.logger.error('Content scan failed', err);
    }
    // Default to requiring manual review on scan error
    return { safe: false, reason: 'Scan service unavailable — manual review required' };
  }

  async createListing(sellerId: string, dto: CreateListingDto) {
    const title = sanitizeText(dto.title.trim().slice(0, 200));
    const description = sanitizeText(dto.description.trim().slice(0, 5000));

    if (title.length < 3) throw new ForbiddenException('Title too short');
    if (description.length < 10) throw new ForbiddenException('Description too short');
    if (dto.price < 0 || dto.price > 1_000_000) throw new ForbiddenException('Invalid price');

    // SSRF protection: validate webhook and agent URLs point to safe external hosts
    if (dto.agentEndpoint && !isSafeUrl(dto.agentEndpoint)) {
      throw new ForbiddenException('Invalid agent endpoint URL');
    }
    if (dto.agentUrl && !isSafeUrl(dto.agentUrl)) {
      throw new ForbiddenException('Invalid agent URL');
    }

    // Check seller is not banned
    const seller = await this.prisma.user.findUnique({ where: { id: sellerId }, select: { isBanned: true } });
    if (!seller || seller.isBanned) throw new ForbiddenException('Account restricted');

    // AI security scan
    const scan = await this.scanContent(title, description);

    return this.prisma.marketListing.create({
      data: {
        title,
        description,
        type: dto.type,
        price: dto.price,
        currency: dto.currency || 'SOL',
        tags: (dto.tags || []).map((t) => sanitizeText(t.slice(0, 50))).slice(0, 10),
        sellerId,
        repositoryId: dto.repositoryId || null,
        agentUrl: dto.agentUrl ? dto.agentUrl.trim().slice(0, 500) : null,
        agentEndpoint: dto.agentEndpoint ? dto.agentEndpoint.trim().slice(0, 500) : null,
        fileKey: dto.fileKey || null,
        fileName: dto.fileName ? sanitizeText(dto.fileName.slice(0, 255)) : null,
        fileSize: dto.fileSize || null,
        fileMimeType: dto.fileMimeType ? dto.fileMimeType.slice(0, 100) : null,
        status: scan.safe ? 'ACTIVE' : 'PENDING_REVIEW',
        scanPassed: scan.safe,
        scanNote: scan.reason,
      },
      include: { seller: { select: { id: true, username: true, avatarUrl: true } } },
    });
  }

  async getListings(params: { type?: string; search?: string; page?: number }) {
    const page = Math.max(1, params.page || 1);
    const take = 20;
    const skip = (page - 1) * take;

    const where: any = { status: 'ACTIVE' };
    if (params.type && params.type !== 'ALL') where.type = params.type;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { tags: { has: params.search.toLowerCase() } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.marketListing.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: { select: { id: true, username: true, avatarUrl: true } },
          repository: { select: { id: true, name: true, githubUrl: true, language: true } },
        },
      }),
      this.prisma.marketListing.count({ where }),
    ]);

    return { data, total, page, pages: Math.ceil(total / take) };
  }

  async getListing(id: string) {
    const listing = await this.prisma.marketListing.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, username: true, avatarUrl: true } },
        repository: { select: { id: true, name: true, githubUrl: true, language: true, stars: true } },
      },
    });
    if (!listing || listing.status === 'REMOVED') throw new NotFoundException('Listing not found');
    return listing;
  }

  async getListingByFileKey(fileKey: string) {
    return this.prisma.marketListing.findUnique({
      where: { fileKey },
      select: { fileName: true, fileMimeType: true },
    });
  }

  async deleteListing(id: string, userId: string) {
    const listing = await this.prisma.marketListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (listing.sellerId !== userId && !['ADMIN', 'MODERATOR'].includes(user?.role || '')) {
      throw new ForbiddenException('Insufficient permissions');
    }

    await this.prisma.marketListing.update({ where: { id }, data: { status: 'REMOVED' } });
  }
}
