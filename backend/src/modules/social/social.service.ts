import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  async sendFriendRequest(senderId: string, receiverId: string): Promise<void> {
    if (!receiverId) throw new BadRequestException('Target user is required');

    const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) throw new NotFoundException('User not found');
    if (receiver.id === senderId) throw new BadRequestException('You cannot add yourself');
    // Honour the receiver's privacy toggle (PR4 — Friends → Privacy).
    // Surface a clear error so the FE can show "X has friend requests
    // turned off" instead of a generic "request failed".
    if (receiver.friendRequestsEnabled === false) {
      throw new ForbiddenException('This user is not accepting friend requests');
    }

    // Wrap the "delete DECLINED row, then re-create" in a transaction so two
    // concurrent re-requests can't both succeed past the delete and then
    // collide on the (senderId, receiverId) unique constraint with an
    // unhandled P2002.
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.friendship.findFirst({
        where: {
          OR: [
            { senderId, receiverId: receiver.id },
            { senderId: receiver.id, receiverId: senderId },
          ],
        },
      });

      if (existing) {
        if (existing.status === 'ACCEPTED') throw new ConflictException('Already friends');
        if (existing.status === 'PENDING') throw new ConflictException('Request already sent');
        // DECLINED — delete and re-create below
        await tx.friendship.delete({ where: { id: existing.id } });
      }

      await tx.friendship.create({ data: { senderId, receiverId: receiver.id } });
    });
  }

  async respondToRequest(userId: string, requestId: string, accept: boolean): Promise<void> {
    const req = await this.prisma.friendship.findUnique({ where: { id: requestId } });
    if (!req || req.receiverId !== userId) throw new NotFoundException('Request not found');
    if (req.status !== 'PENDING') throw new BadRequestException('Request already handled');

    await this.prisma.friendship.update({
      where: { id: requestId },
      data: { status: accept ? FriendshipStatus.ACCEPTED : FriendshipStatus.DECLINED },
    });
  }

  async unfriend(userId: string, targetId: string): Promise<void> {
    // Accept any friendship the caller is part of — ACCEPTED removes the
    // connection, PENDING cancels an outgoing or incoming request. The
    // OR clause already scopes to rows involving `userId`, so there's no
    // way to delete somebody else's friendship.
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: targetId },
          { senderId: targetId, receiverId: userId },
        ],
      },
    });
    if (!friendship) throw new NotFoundException('Friendship not found');
    await this.prisma.friendship.delete({ where: { id: friendship.id } });
  }

  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: FriendshipStatus.ACCEPTED },
          { receiverId: userId, status: FriendshipStatus.ACCEPTED },
        ],
      },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });

    return friendships.map((f) => {
      const friend = f.senderId === userId ? f.receiver : f.sender;
      return { id: f.id, friend, since: f.updatedAt };
    });
  }

  async getPendingRequests(userId: string) {
    const requests = await this.prisma.friendship.findMany({
      where: { receiverId: userId, status: FriendshipStatus.PENDING },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return requests.map((r) => ({ id: r.id, from: r.sender, createdAt: r.createdAt }));
  }

  async getSentRequests(userId: string) {
    const requests = await this.prisma.friendship.findMany({
      where: { senderId: userId, status: FriendshipStatus.PENDING },
      include: {
        receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return requests.map((r) => ({ id: r.id, to: r.receiver, createdAt: r.createdAt }));
  }

  async getFriendshipStatus(
    userId: string,
    targetId: string,
  ): Promise<{
    status: 'none' | 'pending_sent' | 'pending_received' | 'friends';
    requestId?: string;
  }> {
    const f = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: targetId },
          { senderId: targetId, receiverId: userId },
        ],
      },
    });
    if (!f) return { status: 'none' };
    if (f.status === 'ACCEPTED') return { status: 'friends', requestId: f.id };
    if (f.status === 'PENDING') {
      return {
        status: f.senderId === userId ? 'pending_sent' : 'pending_received',
        requestId: f.id,
      };
    }
    return { status: 'none' };
  }
}
