import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { sanitizeText } from '../../common/sanitize/sanitize.util';

const MAX_MESSAGE_LENGTH = 500;
const FLOOD_WINDOW = 10; // seconds
const FLOOD_MAX = 5;     // messages per window
const SPAM_PATTERNS = [
  /(.)\1{9,}/,           // 10+ repeated chars
  /https?:\/\//gi,       // URLs (configurable)
];

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async validateAndSave(
    userId: string,
    content: string,
    ipAddress?: string,
  ): Promise<{ id: string; content: string; userId: string; createdAt: Date; user: { username: string | null; avatarUrl: string | null } }> {
    // ── Input validation ──────────────────────────────────────────────────
    if (!content || typeof content !== 'string') {
      throw new ForbiddenException('Invalid message');
    }

    const trimmed = content.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_MESSAGE_LENGTH) {
      throw new ForbiddenException(`Message must be 1-${MAX_MESSAGE_LENGTH} characters`);
    }

    // ── Flood control ─────────────────────────────────────────────────────
    const floodKey = `chat_flood:${userId}`;
    const count = await this.redis.incr(floodKey);
    if (count === 1) {
      await this.redis.expire(floodKey, FLOOD_WINDOW);
    }
    if (count > FLOOD_MAX) {
      const ttl = await this.redis.ttl(floodKey);
      throw new ForbiddenException(`Rate limited. Try again in ${ttl}s`);
    }

    // ── Spam detection ────────────────────────────────────────────────────
    for (const pattern of SPAM_PATTERNS) {
      if (pattern.test(trimmed)) {
        throw new ForbiddenException('Message contains disallowed content');
      }
    }

    // ── Check user status ─────────────────────────────────────────────────
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true, username: true, avatarUrl: true },
    });

    if (!user || user.isBanned) {
      throw new ForbiddenException('Account is restricted');
    }

    // ── Sanitize and store ────────────────────────────────────────────────
    const sanitized = sanitizeText(trimmed);

    const message = await this.prisma.chatMessage.create({
      data: {
        content: sanitized,
        userId,
      },
      include: {
        user: {
          select: { username: true, avatarUrl: true },
        },
      },
    });

    return message;
  }

  async getRecentMessages(limit = 50, cursor?: string) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: {
          select: { username: true, avatarUrl: true, id: true },
        },
      },
    });
    return messages.reverse();
  }

  async deleteMessage(messageId: string, moderatorId: string, reason?: string) {
    const moderator = await this.prisma.user.findUnique({
      where: { id: moderatorId },
      select: { role: true },
    });

    if (!moderator || !['ADMIN', 'MODERATOR'].includes(moderator.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deleteReason: reason,
      },
    });

    this.logger.log(`Message ${messageId} deleted by moderator ${moderatorId}`);
  }

  async reportMessage(messageId: string, reporterId: string, reason: string) {
    if (!reason || reason.trim().length < 5) {
      throw new ForbiddenException('Report reason is required (min 5 chars)');
    }

    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Message not found');

    // Prevent duplicate reports
    const existing = await this.prisma.report.findFirst({
      where: { messageId, reporterId },
    });

    if (existing) {
      throw new ForbiddenException('You have already reported this message');
    }

    return this.prisma.report.create({
      data: {
        messageId,
        reporterId,
        reason: sanitizeText(reason.trim().slice(0, 500)),
      },
    });
  }
}
