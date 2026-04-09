import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/negotiations',
})
export class NegotiationsGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NegotiationsGateway.name);

  afterInit() {
    this.logger.log('NegotiationsGateway initialized');
  }

  // ── Client joins a negotiation room ──────────────────────────────────────

  @SubscribeMessage('join:negotiation')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() negotiationId: string,
  ) {
    client.join(`neg:${negotiationId}`);
  }

  @SubscribeMessage('leave:negotiation')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() negotiationId: string,
  ) {
    client.leave(`neg:${negotiationId}`);
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
    this.server
      .to(`neg:${negotiationId}`)
      .emit('negotiation:message', message);
  }

  /** Negotiation status changed (AGREED, REJECTED, EXPIRED) */
  emitStatusChange(
    negotiationId: string,
    data: { status: string; agreedPrice?: number | null },
  ) {
    this.server
      .to(`neg:${negotiationId}`)
      .emit('negotiation:status', data);
  }

  /**
   * One party asked to switch to human mode.
   * The other side will see a confirmation prompt — like a Pokémon trade request.
   */
  emitHumanSwitchRequest(
    negotiationId: string,
    requestedByUserId: string,
  ) {
    this.server
      .to(`neg:${negotiationId}`)
      .emit('negotiation:human-switch-request', { requestedByUserId });
  }

  /**
   * Both parties accepted — human mode is now active.
   * Frontend should unlock the message input box for both users.
   */
  emitHumanSwitchActivated(negotiationId: string) {
    this.server
      .to(`neg:${negotiationId}`)
      .emit('negotiation:human-switch-activated', {});
  }

  /** Typing indicator while an agent is "thinking" */
  emitAgentTyping(negotiationId: string, role: 'buyer_agent' | 'seller_agent') {
    this.server
      .to(`neg:${negotiationId}`)
      .emit('negotiation:agent-typing', { role });
  }
}
