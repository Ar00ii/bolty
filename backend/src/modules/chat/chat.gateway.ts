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
import { Logger, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';

interface AuthenticatedSocket extends Socket {
  userId: string;
  username: string;
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
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, { userId: string; username: string }>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
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

      const payload = this.jwtService.verify<{ sub: string; username: string }>(token);
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

    try {
      const message = await this.chatService.validateAndSave(
        client.userId,
        data.content,
      );

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
      const error = err as Error;
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
      await this.chatService.reportMessage(
        data.messageId,
        client.userId,
        data.reason,
      );
      client.emit('reportSuccess', { message: 'Report submitted' });
    } catch (err: unknown) {
      const error = err as Error;
      client.emit('error', { message: error.message });
    }
  }
}
