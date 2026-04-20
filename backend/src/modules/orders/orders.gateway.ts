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

import { OrdersService } from './orders.service';

interface AuthSocket extends Socket {
  userId: string;
  username: string;
}

@WebSocketGateway({
  namespace: '/orders',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket'],
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(OrdersGateway.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

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
      (client as AuthSocket).userId = payload.sub;
      (client as AuthSocket).username = payload.username || 'anon';
      client.join(`user:${payload.sub}`);
      this.logger.log(`Orders WS connected: ${client.id} (${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthSocket) {
    this.logger.log(`Orders WS disconnected: ${client.id}`);
  }

  /** Join a specific order room to receive real-time updates */
  @SubscribeMessage('joinOrder')
  async handleJoinOrder(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { orderId: string },
  ) {
    if (!client.userId) throw new WsException('Unauthorized');
    try {
      // Auth check — throws if user is not buyer/seller
      await this.ordersService.getOrder(data.orderId, client.userId);
      client.join(`order:${data.orderId}`);
      client.emit('joinedOrder', { orderId: data.orderId });
    } catch (err: unknown) {
      client.emit('error', { message: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  /** Send a message in an order chat */
  @SubscribeMessage('orderMessage')
  async handleOrderMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { orderId: string; content: string },
  ) {
    if (!client.userId) throw new WsException('Unauthorized');
    try {
      const message = await this.ordersService.sendMessage(
        data.orderId,
        client.userId,
        data.content,
      );

      const payload = {
        id: message.id,
        orderId: data.orderId,
        content: message.content,
        senderId: message.senderId,
        senderUsername: message.sender?.username ?? null,
        senderAvatar: message.sender?.avatarUrl ?? null,
        createdAt: message.createdAt,
      };

      // Broadcast to everyone in the order room (buyer + seller)
      this.server.to(`order:${data.orderId}`).emit('newOrderMessage', payload);
    } catch (err: unknown) {
      client.emit('error', { message: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  /** Broadcast a status change to everyone in the order room */
  emitStatusChange(orderId: string, status: string) {
    this.server.to(`order:${orderId}`).emit('orderStatusChanged', { orderId, status });
  }
}
