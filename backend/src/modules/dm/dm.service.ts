import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { sanitizeText } from '../../common/sanitize/sanitize.util';

const MAX_DM_LENGTH = 2000;

@Injectable()
export class DmService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Verify receiver exists and is not banned
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, isBanned: true },
    });
    if (!receiver) throw new ForbiddenException('User not found');

    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { isBanned: true },
    });
    if (!sender || sender.isBanned) throw new ForbiddenException('Account restricted');

    return this.prisma.directMessage.create({
      data: {
        content: sanitizeText(trimmed),
        senderId,
        receiverId,
      },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
  }

  async getConversation(userId: string, peerId: string, take = 50) {
    const messages = await this.prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: peerId },
          { senderId: peerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take,
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

  /** Returns list of users the current user has exchanged DMs with, latest first */
  async getContacts(userId: string) {
    const raw = await this.prisma.directMessage.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'desc' },
      select: {
        senderId: true,
        receiverId: true,
        content: true,
        createdAt: true,
        isRead: true,
        sender: { select: { id: true, username: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

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

      const unread = await this.prisma.directMessage.count({
        where: { senderId: peer.id, receiverId: userId, isRead: false },
      });

      contacts.push({
        user: peer,
        lastMessage: msg.content.slice(0, 60),
        lastAt: msg.createdAt,
        unread,
      });
    }

    return contacts;
  }
}
