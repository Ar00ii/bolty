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
