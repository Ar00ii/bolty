import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { PrismaService } from '../../common/prisma/prisma.service';

import { DmService } from './dm.service';

interface AuthenticatedSocket extends Socket {
  userId: string;
  username: string;
}

/** Simple sliding-window rate limiter: max messages per window (ms) per user */
class WsRateLimiter {
  private readonly counts = new Map<string, { count: number; resetAt: number }>();
  private cleanupTimer: NodeJS.Timeout;

  constructor(
    private readonly maxMessages: number,
    private readonly windowMs: number,
  ) {
    // Purge expired entries every 5 minutes — otherwise the map grows
    // unbounded with one stale entry per connecting user forever.
    this.cleanupTimer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    this.cleanupTimer.unref?.();
  }

  isAllowed(userId: string): boolean {
    const now = Date.now();
    const entry = this.counts.get(userId);

    if (!entry || now >= entry.resetAt) {
      this.counts.set(userId, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (entry.count >= this.maxMessages) return false;

    entry.count++;
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.counts) {
      if (now >= entry.resetAt) this.counts.delete(key);
    }
  }

  destroy(): void {
    clearInterval(this.cleanupTimer);
  }
}

@WebSocketGateway({
  namespace: '/dm',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket'],
})
export class DmGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(DmGateway.name);

  /** Maps userId -> Set of socketIds (one user can have multiple tabs) */
  private userSockets = new Map<string, Set<string>>();

  /** 20 messages per 10 seconds per user */
  private readonly rateLimiter = new WsRateLimiter(20, 10_000);

  /**
   * Short-lived ban cache so we don't hit Postgres on every single event.
   * 30s TTL is low enough to revoke a live session quickly after a ban.
   */
  private banCache = new Map<string, { banned: boolean; expiresAt: number }>();

  constructor(
    private readonly dmService: DmService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private async isBanned(userId: string): Promise<boolean> {
    const now = Date.now();
    const cached = this.banCache.get(userId);
    if (cached && cached.expiresAt > now) return cached.banned;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true },
    });
    const banned = user?.isBanned === true;
    this.banCache.set(userId, { banned, expiresAt: now + 30_000 });
    return banned;
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.cookie
          ?.split(';')
          .find((c) => c.trim().startsWith('access_token='))
          ?.split('=')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT with explicit secret
      const jwtSecret = this.config.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }

      const payload = this.jwtService.verify<{ sub: string; username: string }>(token, {
        secret: jwtSecret,
      });
      (client as AuthenticatedSocket).userId = payload.sub;
      (client as AuthenticatedSocket).username = payload.username || 'anon';

      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(client.id);

      // Put client in a personal room so we can target them by userId
      client.join(`user:${payload.sub}`);

      // Send contact list on connect
      const contacts = await this.dmService.getContacts(payload.sub);
      client.emit('contacts', contacts);

      this.logger.log(`DM client connected: ${client.id} (${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.userSockets.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) this.userSockets.delete(client.userId);
      }
    }
    this.logger.log(`DM client disconnected: ${client.id}`);
  }

  /** Load conversation with a specific user */
  @SubscribeMessage('openConversation')
  async handleOpen(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { peerId: string },
  ) {
    if (!client.userId) throw new WsException('Unauthorized');
    if (await this.isBanned(client.userId)) {
      client.emit('error', { message: 'Account is banned' });
      client.disconnect();
      return;
    }
    try {
      const messages = await this.dmService.getConversation(client.userId, data.peerId);
      client.emit('conversation', { peerId: data.peerId, messages });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      client.emit('error', { message: error.message });
    }
  }

  /** Send a direct message */
  @SubscribeMessage('sendDM')
  async handleSendDM(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { receiverId: string; content: string },
  ) {
    if (!client.userId) throw new WsException('Unauthorized');
    if (await this.isBanned(client.userId)) {
      client.emit('error', { message: 'Account is banned' });
      client.disconnect();
      return;
    }
    if (!this.rateLimiter.isAllowed(client.userId)) {
      client.emit('error', { message: 'Rate limit exceeded. Slow down.' });
      return;
    }
    try {
      const message = await this.dmService.sendMessage(
        client.userId,
        data.receiverId,
        data.content,
      );

      const payload = {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderUsername: message.sender.username,
        senderAvatar: message.sender.avatarUrl,
        createdAt: message.createdAt,
        isRead: false,
      };

      // Echo to sender
      client.emit('newDM', { peerId: data.receiverId, message: payload });

      // Deliver to receiver (all their active tabs)
      this.server.to(`user:${data.receiverId}`).emit('newDM', {
        peerId: client.userId,
        message: payload,
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      client.emit('error', { message: error.message });
    }
  }
}
