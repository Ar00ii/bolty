import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Notification } from '@prisma/client';
import { Server, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  userId: string;
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim()),
    credentials: true,
  },
  transports: ['websocket'],
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: Socket) {
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

      const jwtSecret = this.config.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<{ sub: string }>(token, { secret: jwtSecret });
      (client as AuthenticatedSocket).userId = payload.sub;

      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(client.id);

      client.join(`user:${payload.sub}`);
      this.logger.log(`Notifications client connected: ${client.id} (${payload.sub})`);
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
  }

  /** Push a freshly-created notification to all of the user's open tabs. */
  pushToUser(userId: string, notification: Notification) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  /** Broadcast that a notification was marked read (from another tab). */
  pushReadToUser(userId: string, notificationId: string) {
    this.server.to(`user:${userId}`).emit('notification:read', { id: notificationId });
  }

  /** Broadcast that all notifications have been read. */
  pushReadAllToUser(userId: string) {
    this.server.to(`user:${userId}`).emit('notification:read-all', {});
  }
}
