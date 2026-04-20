import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { sanitizeText } from '../../common/sanitize/sanitize.util';
import { EscrowService } from '../escrow/escrow.service';
import { NotificationsService } from '../notifications/notifications.service';

const MAX_MSG_LENGTH = 2000;

const ORDER_INCLUDE = {
  buyer: { select: { id: true, username: true, avatarUrl: true } },
  seller: { select: { id: true, username: true, avatarUrl: true } },
  listing: { select: { id: true, title: true, type: true, price: true, currency: true } },
} as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly escrow: EscrowService,
  ) {}

  /** All orders where the user is the buyer */
  async getBuyerOrders(userId: string) {
    return this.prisma.marketPurchase.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: 'desc' },
      include: ORDER_INCLUDE,
    });
  }

  /** All orders where the user is the seller */
  async getSellerOrders(userId: string) {
    return this.prisma.marketPurchase.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: 'desc' },
      include: ORDER_INCLUDE,
    });
  }

  /** Single order — only buyer or seller can view */
  async getOrder(orderId: string, userId: string) {
    const order = await this.prisma.marketPurchase.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return order;
  }

  /** Seller marks order as in progress */
  async markInProgress(orderId: string, userId: string) {
    const order = await this.getOrder(orderId, userId);
    if (order.sellerId !== userId) throw new ForbiddenException('Only seller can update status');
    if (order.status !== 'PENDING_DELIVERY') {
      throw new BadRequestException('Order must be in PENDING_DELIVERY to mark as in progress');
    }
    return this.prisma.marketPurchase.update({
      where: { id: orderId },
      data: { status: 'IN_PROGRESS' },
      include: ORDER_INCLUDE,
    });
  }

  /** Seller marks order as delivered (with optional delivery note) */
  async markDelivered(orderId: string, userId: string, deliveryNote?: string) {
    const order = await this.getOrder(orderId, userId);
    if (order.sellerId !== userId)
      throw new ForbiddenException('Only seller can mark as delivered');
    if (!['PENDING_DELIVERY', 'IN_PROGRESS'].includes(order.status)) {
      throw new BadRequestException('Invalid status transition');
    }
    const updated = await this.prisma.marketPurchase.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        deliveryNote: deliveryNote ? sanitizeText(deliveryNote.slice(0, 2000)) : null,
      },
      include: ORDER_INCLUDE,
    });

    try {
      await this.notifications.create({
        userId: updated.buyerId,
        type: 'MARKET_ORDER_DELIVERED',
        title: `"${updated.listing.title}" has been delivered`,
        body:
          updated.escrowStatus === 'FUNDED'
            ? 'Review the delivery and release escrow to complete the order.'
            : 'Review the delivery and mark the order complete when ready.',
        url: `/orders/${updated.id}`,
        meta: { orderId: updated.id, listingId: updated.listingId },
      });
    } catch {
      /* notification failures must not block order flow */
    }

    return updated;
  }

  /**
   * Buyer marks order as completed.
   * If escrow is active, the release tx is verified on chain against the
   * escrow contract before the order is closed. The frontend must call
   * escrow.release() first and pass the resulting tx hash.
   */
  async markCompleted(orderId: string, userId: string, escrowReleaseTx?: string) {
    const order = await this.getOrder(orderId, userId);
    if (order.buyerId !== userId) throw new ForbiddenException('Only buyer can mark as completed');
    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('Order must be DELIVERED before completing');
    }

    if (order.escrowStatus === 'FUNDED') {
      if (!escrowReleaseTx) {
        throw new BadRequestException(
          'Escrow release transaction hash required. Release funds from escrow first.',
        );
      }
      // Delegate to EscrowService: it verifies the tx on chain, confirms the
      // contract status landed at RELEASED, updates the order, and notifies.
      return this.escrow.confirmRelease(orderId, userId, escrowReleaseTx);
    }

    const completed = await this.prisma.marketPurchase.update({
      where: { id: orderId },
      data: { status: 'COMPLETED', completedAt: new Date() },
      include: ORDER_INCLUDE,
    });

    try {
      await this.notifications.create({
        userId: completed.sellerId,
        type: 'MARKET_ORDER_COMPLETED',
        title: `Order completed: "${completed.listing.title}"`,
        body: 'The buyer confirmed delivery. Thanks for shipping!',
        url: `/orders/${completed.id}`,
        meta: { orderId: completed.id, listingId: completed.listingId },
      });
    } catch {
      /* notification failures must not block order flow */
    }

    return completed;
  }

  /**
   * Either party opens a dispute.
   * If escrow is active, the caller must have already called dispute() on the
   * escrow contract and must pass the tx hash so we can verify it on chain.
   */
  async dispute(orderId: string, userId: string, options?: { txHash?: string; reason?: string }) {
    const order = await this.getOrder(orderId, userId);
    if (order.status === 'COMPLETED' || order.status === 'DISPUTED') {
      throw new BadRequestException('Cannot dispute this order');
    }

    if (order.escrowStatus === 'FUNDED') {
      if (!options?.txHash) {
        throw new BadRequestException(
          'Escrow dispute transaction hash required. Call escrow.dispute() first.',
        );
      }
      return this.escrow.confirmDispute(orderId, userId, options.txHash, {
        reason: options.reason,
      });
    }

    const updated = await this.prisma.marketPurchase.update({
      where: { id: orderId },
      data: { status: 'DISPUTED' },
      include: ORDER_INCLUDE,
    });

    if (options?.reason?.trim()) {
      await this.prisma.orderMessage.create({
        data: {
          orderId,
          senderId: userId,
          content: `[DISPUTE OPENED] ${sanitizeText(options.reason.trim().slice(0, 1800))}`,
        },
      });
    }

    const recipientId = userId === updated.buyerId ? updated.sellerId : updated.buyerId;
    try {
      await this.notifications.create({
        userId: recipientId,
        type: 'SYSTEM',
        title: `Dispute opened on "${updated.listing.title}"`,
        body: 'The other party opened a dispute. Review the order chat and resolve, or contact support.',
        url: `/orders/${updated.id}`,
        meta: { orderId: updated.id, listingId: updated.listingId, openedBy: userId },
      });
    } catch {
      /* notification failures must not block order flow */
    }

    return updated;
  }

  /** Get order chat messages (latest 200 — orders rarely have more) */
  async getMessages(orderId: string, userId: string) {
    await this.getOrder(orderId, userId); // auth check
    const recent = await this.prisma.orderMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
    return recent.reverse();
  }

  /** Send a message in the order chat */
  async sendMessage(orderId: string, senderId: string, content: string) {
    if (!content || typeof content !== 'string') throw new BadRequestException('Invalid message');
    const trimmed = content.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_MSG_LENGTH) {
      throw new BadRequestException(`Message must be 1-${MAX_MSG_LENGTH} characters`);
    }

    const order = await this.getOrder(orderId, senderId); // auth check

    const message = await this.prisma.orderMessage.create({
      data: {
        orderId,
        senderId,
        content: sanitizeText(trimmed),
      },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    const recipientId = senderId === order.buyerId ? order.sellerId : order.buyerId;
    // Throttle: only notify if recipient doesn't already have an unread
    // message notification from this order in the last 10 minutes.
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId: recipientId,
          type: 'MARKET_NEGOTIATION_MESSAGE',
          readAt: null,
          createdAt: { gte: tenMinutesAgo },
          meta: { path: ['orderId'], equals: orderId },
        },
        select: { id: true },
      });
      if (!existing) {
        const senderName = message.sender.username || 'Someone';
        await this.notifications.create({
          userId: recipientId,
          type: 'MARKET_NEGOTIATION_MESSAGE',
          title: `New message from @${senderName} on "${order.listing.title}"`,
          body: trimmed.slice(0, 200),
          url: `/orders/${orderId}`,
          meta: { orderId, senderId },
        });
      }
    } catch {
      /* notification failures must not block chat flow */
    }

    return message;
  }

  /** System message when order is created */
  async sendSystemMessage(orderId: string, content: string, senderId: string) {
    return this.prisma.orderMessage.create({
      data: { orderId, senderId, content: content.slice(0, 500) },
      include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
    });
  }

  /** Stats for seller dashboard */
  async getSellerStats(userId: string) {
    const [total, pending, inProgress, delivered, completed, disputed] = await Promise.all([
      this.prisma.marketPurchase.count({ where: { sellerId: userId } }),
      this.prisma.marketPurchase.count({ where: { sellerId: userId, status: 'PENDING_DELIVERY' } }),
      this.prisma.marketPurchase.count({ where: { sellerId: userId, status: 'IN_PROGRESS' } }),
      this.prisma.marketPurchase.count({ where: { sellerId: userId, status: 'DELIVERED' } }),
      this.prisma.marketPurchase.count({ where: { sellerId: userId, status: 'COMPLETED' } }),
      this.prisma.marketPurchase.count({ where: { sellerId: userId, status: 'DISPUTED' } }),
    ]);
    return { total, pending, inProgress, delivered, completed, disputed };
  }
}
