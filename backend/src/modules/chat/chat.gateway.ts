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

import { ChatService } from './chat.service';

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
    // Purge expired entries every 5 minutes to prevent unbounded memory growth
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
  namespace: '/chat',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, { userId: string; username: string }>();

  /** 10 messages per 10 seconds per user (public chat is stricter than DMs) */
  private readonly rateLimiter = new WsRateLimiter(10, 10_000);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from cookie or handshake auth
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
      (client as AuthenticatedSocket).username = payload.username || 'Anonymous';

      this.connectedUsers.set(client.id, {
        userId: payload.sub,
        username: payload.username || 'Anonymous',
      });

      // Send recent messages on connect
      const recent = await this.chatService.getRecentMessages(50);
      client.emit('history', recent);

      // Broadcast user count
      this.server.emit('userCount', this.connectedUsers.size);

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
    this.server.emit('userCount', this.connectedUsers.size);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { content: string },
  ) {
    if (!client.userId) {
      throw new WsException('Unauthorized');
    }

    if (!this.rateLimiter.isAllowed(client.userId)) {
      client.emit('error', { message: 'Rate limit exceeded. Slow down.' });
      return;
    }

    try {
      const message = await this.chatService.validateAndSave(client.userId, data.content);

      // Broadcast to all connected clients
      this.server.emit('newMessage', {
        id: message.id,
        content: message.content,
        userId: message.userId,
        username: message.user.username,
        avatarUrl: message.user.avatarUrl,
        createdAt: message.createdAt,
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('reportMessage')
  async handleReport(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; reason: string },
  ) {
    if (!client.userId) throw new WsException('Unauthorized');

    try {
      await this.chatService.reportMessage(data.messageId, client.userId, data.reason);
      client.emit('reportSuccess', { message: 'Report submitted' });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      client.emit('error', { message: error.message });
    }
  }
}
