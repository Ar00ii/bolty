import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Negotiations WebSocket Gateway — Real-time agent/human negotiation
 *
 * Security:
 * - JWT validation on connection (from cookies)
 * - CORS restricted to frontend origins only
 * - Per-room authorization: verify user is buyer or seller
 * - Socket data stores authenticated userId
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/negotiations',
})
export class NegotiationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NegotiationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit() {
    this.logger.log('NegotiationsGateway initialized');
  }

  /**
   * Authenticate client on WebSocket connection
   * Reads JWT from cookie headers and validates
   */
  async handleConnection(client: Socket) {
    try {
      const cookies = this.parseCookies(client.handshake.headers.cookie || '');
      const accessToken = cookies['access_token'];

      if (!accessToken) {
        client.disconnect(true);
        this.logger.warn(`Unauthorized WS connection attempt (no token) from ${client.id}`);
        return;
      }

      // Validate JWT
      const jwtSecret = this.config.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }

      const payload = this.jwtService.verify(accessToken, { secret: jwtSecret });
      const userId = payload.sub;

      if (!userId) {
        client.disconnect(true);
        this.logger.warn(`Invalid JWT payload from ${client.id}`);
        return;
      }

      // Store authenticated userId in socket data
      client.data.userId = userId;
      this.logger.debug(`WebSocket connected: user ${userId} (${client.id})`);
    } catch (err) {
      client.disconnect(true);
      this.logger.warn(`WS authentication failed: ${(err as Error).message}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`WebSocket disconnected: ${client.id}`);
  }

  /**
   * Client joins a negotiation room
   * Verify that the user is actually a participant (buyer or seller)
   */
  @SubscribeMessage('join:negotiation')
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() negotiationId: string) {
    const userId = client.data.userId;

    if (!userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    // Verify user is a participant in this negotiation
    const negotiation = await this.prisma.agentNegotiation.findUnique({
      where: { id: negotiationId },
      select: { buyerId: true, listing: { select: { sellerId: true } } },
    });

    if (!negotiation) {
      client.emit('error', { message: 'Negotiation not found' });
      return;
    }

    if (!negotiation.listing) {
      client.emit('error', { message: 'Negotiation listing not found' });
      return;
    }

    if (negotiation.buyerId !== userId && negotiation.listing.sellerId !== userId) {
      client.emit('error', { message: 'Unauthorized: you are not a participant' });
      this.logger.warn(`Unauthorized join attempt: user ${userId} on negotiation ${negotiationId}`);
      return;
    }

    // User is authorized, join the room
    client.join(`neg:${negotiationId}`);
    this.logger.debug(`User ${userId} joined negotiation ${negotiationId}`);
  }

  @SubscribeMessage('leave:negotiation')
  handleLeave(@ConnectedSocket() client: Socket, @MessageBody() negotiationId: string) {
    const userId = client.data.userId;
    if (!userId) {
      return;
    }
    client.leave(`neg:${negotiationId}`);
    this.logger.debug(`User ${userId} left negotiation ${negotiationId}`);
  }

  /**
   * Helper: parse cookies from header string
   */
  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) return cookies;
    cookieHeader.split(/;\s*/).forEach((cookie) => {
      const [key, value] = cookie.split('=');
      if (key && value) {
        cookies[key] = decodeURIComponent(value);
      }
    });
    return cookies;
  }

  // ── Emit helpers (called by NegotiationService) ───────────────────────────

  /** A new message was added (by an agent or human) */
  emitNewMessage(
    negotiationId: string,
    message: {
      id: string;
      fromRole: string;
      content: string;
      proposedPrice?: number | null;
      createdAt: Date;
    },
  ) {
    this.server.to(`neg:${negotiationId}`).emit('negotiation:message', message);
  }

  /** Negotiation status changed (AGREED, REJECTED, EXPIRED) */
  emitStatusChange(negotiationId: string, data: { status: string; agreedPrice?: number | null }) {
    this.server.to(`neg:${negotiationId}`).emit('negotiation:status', data);
  }

  /**
   * One party asked to switch to human mode.
   * The other side will see a confirmation prompt — like a Pokémon trade request.
   */
  emitHumanSwitchRequest(negotiationId: string, requestedByUserId: string) {
    this.server
      .to(`neg:${negotiationId}`)
      .emit('negotiation:human-switch-request', { requestedByUserId });
  }

  /**
   * Both parties accepted — human mode is now active.
   * Frontend should unlock the message input box for both users.
   */
  emitHumanSwitchActivated(negotiationId: string) {
    this.server.to(`neg:${negotiationId}`).emit('negotiation:human-switch-activated', {});
  }

  /** Typing indicator while an agent is "thinking" */
  emitAgentTyping(negotiationId: string, role: 'buyer_agent' | 'seller_agent') {
    this.server.to(`neg:${negotiationId}`).emit('negotiation:agent-typing', { role });
  }

  /**
   * Something went wrong in a background AI turn — surface it to the room
   * so the UI can show a non-silent failure state instead of a hung spinner.
   */
  emitError(
    negotiationId: string,
    data: { stage: 'seller_turn' | 'buyer_turn' | 'kickoff'; message: string },
  ) {
    this.server.to(`neg:${negotiationId}`).emit('negotiation:error', data);
  }
}
