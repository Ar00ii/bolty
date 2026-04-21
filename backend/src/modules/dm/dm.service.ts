import { Injectable, ForbiddenException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { sanitizeText } from '../../common/sanitize/sanitize.util';
import { NotificationsService } from '../notifications/notifications.service';

const MAX_DM_LENGTH = 2000;

@Injectable()
export class DmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async sendMessage(senderId: string, receiverId: string, content: string) {
    if (!content || typeof content !== 'string') {
      throw new ForbiddenException('Invalid message');
    }

    const trimmed = content.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_DM_LENGTH) {
      throw new ForbiddenException(`Message must be 1-${MAX_DM_LENGTH} characters`);
    }

    if (senderId === receiverId) {
      throw new ForbiddenException('Cannot send message to yourself');
    }

    // Batch receiver + sender checks so sending a DM is a single round-trip
    // to Postgres instead of two sequential findUnique calls.
    const [receiver, sender] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true, isBanned: true },
      }),
      this.prisma.user.findUnique({
        where: { id: senderId },
        select: { id: true, isBanned: true, username: true, displayName: true },
      }),
    ]);
    if (!receiver) throw new ForbiddenException('User not found');
    if (!sender || sender.isBanned) throw new ForbiddenException('Account restricted');

    const safeContent = sanitizeText(trimmed);
    const message = await this.prisma.directMessage.create({
      data: {
        content: safeContent,
        senderId,
        receiverId,
      },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    // Fire-and-forget notification — never let a notification failure block
    // the DM round-trip the user is waiting for.
    this.notifications
      .create({
        userId: receiverId,
        type: 'DM_RECEIVED',
        title: `New message from @${sender.username || sender.displayName || 'someone'}`,
        body: safeContent.slice(0, 160),
        url: `/dm?with=${senderId}`,
        meta: { senderId, messageId: message.id },
      })
      .catch(() => {
        /* swallow — DM should still succeed even if notification fails */
      });

    return message;
  }

  /** System-initiated DM — no banned/length checks (internal use only) */
  async sendSystemMessage(senderId: string, receiverId: string, content: string) {
    if (senderId === receiverId) return null;
    return this.prisma.directMessage.create({
      data: { content: content.slice(0, 2000), senderId, receiverId },
      include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
    });
  }

  async getConversation(userId: string, peerId: string, take = 50) {
    // Hard cap so a caller passing an absurd `take` can't blow memory.
    const safeTake = Math.min(Math.max(1, take), 100);
    const messages = await this.prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: peerId },
          { senderId: peerId, receiverId: userId },
        ],
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: safeTake,
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    // Mark received messages as read
    await this.prisma.directMessage.updateMany({
      where: { senderId: peerId, receiverId: userId, isRead: false },
      data: { isRead: true },
    });

    return messages;
  }

  async getTotalUnread(userId: string): Promise<number> {
    return this.prisma.directMessage.count({
      where: { receiverId: userId, isRead: false },
    });
  }

  /** Returns list of users the current user has exchanged DMs with, latest first */
  async getContacts(userId: string) {
    // Fetch most-recent message per peer and all unread counts in two queries (no N+1)
    const [raw, unreadGroups] = await Promise.all([
      this.prisma.directMessage.findMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
        orderBy: { createdAt: 'desc' },
        take: 500,
        select: {
          senderId: true,
          receiverId: true,
          content: true,
          createdAt: true,
          sender: { select: { id: true, username: true, avatarUrl: true } },
          receiver: { select: { id: true, username: true, avatarUrl: true } },
        },
      }),
      this.prisma.directMessage.groupBy({
        by: ['senderId'],
        where: { receiverId: userId, isRead: false },
        _count: { id: true },
      }),
    ]);

    // Build unread count lookup: senderId → count
    const unreadMap = new Map<string, number>(unreadGroups.map((g) => [g.senderId, g._count.id]));

    // Deduplicate to one entry per peer
    const seen = new Set<string>();
    const contacts: Array<{
      user: { id: string; username: string | null; avatarUrl: string | null };
      lastMessage: string;
      lastAt: Date;
      unread: number;
    }> = [];

    for (const msg of raw) {
      const peer = msg.senderId === userId ? msg.receiver : msg.sender;
      if (seen.has(peer.id)) continue;
      seen.add(peer.id);

      contacts.push({
        user: peer,
        lastMessage: msg.content.slice(0, 60),
        lastAt: msg.createdAt,
        unread: unreadMap.get(peer.id) ?? 0,
      });
    }

    return contacts;
  }
}
