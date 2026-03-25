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
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { DmService } from './dm.service';

interface AuthenticatedSocket extends Socket {
  userId: string;
  username: string;
}

/** Simple sliding-window rate limiter: max messages per window (ms) per user */
class WsRateLimiter {
  private readonly counts = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly maxMessages: number,
    private readonly windowMs: number,
  ) {}

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
  server: Server;

  private readonly logger = new Logger(DmGateway.name);

  /** Maps userId -> Set of socketIds (one user can have multiple tabs) */
  private userSockets = new Map<string, Set<string>>();

  /** 20 messages per 10 seconds per user */
  private readonly rateLimiter = new WsRateLimiter(20, 10_000);

  constructor(
    private readonly dmService: DmService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.cookie
          ?.split(';')
          .find((c) => c.trim().startsWith('access_token='))
          ?.split('=')[1];

      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify<{ sub: string; username: string }>(token);
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
    try {
      const messages = await this.dmService.getConversation(client.userId, data.peerId);
      client.emit('conversation', { peerId: data.peerId, messages });
    } catch (err: any) {
      client.emit('error', { message: err.message });
    }
  }

  /** Send a direct message */
  @SubscribeMessage('sendDM')
  async handleSendDM(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { receiverId: string; content: string },
  ) {
    if (!client.userId) throw new WsException('Unauthorized');
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
    } catch (err: any) {
      client.emit('error', { message: err.message });
    }
  }
}
