import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';

import { NotificationsGateway } from './notifications.gateway';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  url?: string | null;
  meta?: Prisma.InputJsonValue | null;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title.slice(0, 200),
        body: input.body ? input.body.slice(0, 2000) : null,
        url: input.url || null,
        meta: input.meta ?? Prisma.JsonNull,
      },
    });
    this.gateway.pushToUser(input.userId, notification);
    return notification;
  }

  async list(userId: string, params: { unreadOnly?: boolean; take?: number } = {}) {
    const take = Math.min(100, Math.max(1, params.take ?? 30));
    const where: Prisma.NotificationWhereInput = { userId };
    if (params.unreadOnly) where.readAt = null;
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
      }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { items, unreadCount };
  }

  async unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(id: string, userId: string) {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n || n.userId !== userId) throw new NotFoundException();
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    this.gateway.pushReadToUser(userId, id);
    return updated;
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    this.gateway.pushReadAllToUser(userId);
    return { ok: true };
  }
}
