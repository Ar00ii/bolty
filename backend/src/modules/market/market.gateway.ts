import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';

/**
 * Market events gateway — public, anonymous-friendly.
 *
 * Powers the live pulse on the marketplace: every new listing and
 * every completed purchase is broadcast to all connected clients so
 * the frontend can flash rows and append to the trades feed.
 *
 * No authentication required — the payload is already public data
 * (what you'd see on the marketplace list). We emit from the service
 * layer after DB writes succeed.
 */
@WebSocketGateway({
  namespace: '/market',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class MarketGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MarketGateway.name);

  afterInit() {
    this.logger.log('MarketGateway initialized on /market');
  }

  emitSale(payload: {
    listingId: string;
    listingTitle: string;
    listingType: string;
    amountWei: string;
    priceEth: number | null;
    currency: string;
    buyer: { id: string; username: string | null; avatarUrl: string | null };
    seller: { id: string; username: string | null };
    createdAt: string;
  }): void {
    this.server?.emit('sale', payload);
  }

  emitNewListing(payload: {
    listingId: string;
    title: string;
    type: string;
    price: number;
    currency: string;
    tags: string[];
    seller: { id: string; username: string | null; avatarUrl: string | null };
    createdAt: string;
  }): void {
    this.server?.emit('new-listing', payload);
  }
}
