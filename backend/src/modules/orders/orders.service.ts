import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { sanitizeText } from '../../common/sanitize/sanitize.util';
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
        url: `/market/orders/${updated.id}`,
        meta: { orderId: updated.id, listingId: updated.listingId },
      });
    } catch {
      /* notification failures must not block order flow */
    }

    return updated;
  }

  /**
   * Buyer marks order as completed.
   * If escrow is active, the frontend must call the escrow contract's release()
   * function BEFORE calling this endpoint and pass the release tx hash.
   */
  async markCompleted(orderId: string, userId: string, escrowReleaseTx?: string) {
    const order = await this.getOrder(orderId, userId);
    if (order.buyerId !== userId) throw new ForbiddenException('Only buyer can mark as completed');
    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('Order must be DELIVERED before completing');
    }

    // If this order uses escrow, require release tx proof
    const data: any = { status: 'COMPLETED', completedAt: new Date() };
    if (order.escrowStatus === 'FUNDED') {
      if (!escrowReleaseTx) {
        throw new BadRequestException(
          'Escrow release transaction hash required. Release funds from escrow first.',
        );
      }
      data.escrowReleaseTx = escrowReleaseTx;
      data.escrowStatus = 'RELEASED';
      data.escrowResolvedAt = new Date();
    }

    const completed = await this.prisma.marketPurchase.update({
      where: { id: orderId },
      data,
      include: ORDER_INCLUDE,
    });

    try {
      await this.notifications.create({
        userId: completed.sellerId,
        type: 'MARKET_ORDER_COMPLETED',
        title: `Order completed: "${completed.listing.title}"`,
        body:
          completed.escrowStatus === 'RELEASED'
            ? 'Escrow has been released. Funds are on their way to your wallet.'
            : 'The buyer confirmed delivery. Thanks for shipping!',
        url: `/market/orders/${completed.id}`,
        meta: { orderId: completed.id, listingId: completed.listingId },
      });
    } catch {
      /* notification failures must not block order flow */
    }

    return completed;
  }

  /**
   * Either party can open a dispute.
   * If escrow is active, the frontend should also call dispute() on the contract.
   */
  async dispute(orderId: string, userId: string) {
    const order = await this.getOrder(orderId, userId);
    if (order.status === 'COMPLETED' || order.status === 'DISPUTED') {
      throw new BadRequestException('Cannot dispute this order');
    }

    const data: Record<string, unknown> = { status: 'DISPUTED' };
    if (order.escrowStatus === 'FUNDED') {
      data.escrowStatus = 'DISPUTED';
      data.escrowDisputedAt = new Date();
    }

    return this.prisma.marketPurchase.update({
      where: { id: orderId },
      data,
      include: ORDER_INCLUDE,
    });
  }

  /** Get order chat messages */
  async getMessages(orderId: string, userId: string) {
    await this.getOrder(orderId, userId); // auth check
    return this.prisma.orderMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
  }

  /** Send a message in the order chat */
  async sendMessage(orderId: string, senderId: string, content: string) {
    if (!content || typeof content !== 'string') throw new BadRequestException('Invalid message');
    const trimmed = content.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_MSG_LENGTH) {
      throw new BadRequestException(`Message must be 1-${MAX_MSG_LENGTH} characters`);
    }

    await this.getOrder(orderId, senderId); // auth check

    return this.prisma.orderMessage.create({
      data: {
        orderId,
        senderId,
        content: sanitizeText(trimmed),
      },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
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
