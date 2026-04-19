import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { IsString, IsOptional, MaxLength } from 'class-validator';
import type { Request as ExpressRequest } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { OrdersService } from './orders.service';

class DeliverDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  deliveryNote?: string;
}

class CompleteDto {
  @IsOptional()
  @IsString()
  escrowReleaseTx?: string;
}

class DisputeDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  txHash?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}

class SendMessageDto {
  @IsString()
  @MaxLength(5000)
  content!: string;
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** GET /orders — orders where I'm the buyer */
  @Get()
  getBuyerOrders(@Request() req: ExpressRequest & { user: { id: string } }) {
    return this.ordersService.getBuyerOrders(req.user.id);
  }

  /** GET /orders/selling — orders where I'm the seller */
  @Get('selling')
  getSellerOrders(@Request() req: ExpressRequest & { user: { id: string } }) {
    return this.ordersService.getSellerOrders(req.user.id);
  }

  /** GET /orders/seller/stats */
  @Get('seller/stats')
  getSellerStats(@Request() req: ExpressRequest & { user: { id: string } }) {
    return this.ordersService.getSellerStats(req.user.id);
  }

  /** GET /orders/:id */
  @Get(':id')
  getOrder(@Param('id') id: string, @Request() req: ExpressRequest & { user: { id: string } }) {
    return this.ordersService.getOrder(id, req.user.id);
  }

  /** GET /orders/:id/messages */
  @Get(':id/messages')
  getMessages(@Param('id') id: string, @Request() req: ExpressRequest & { user: { id: string } }) {
    return this.ordersService.getMessages(id, req.user.id);
  }

  /** POST /orders/:id/in-progress */
  @Post(':id/in-progress')
  markInProgress(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: { id: string } },
  ) {
    return this.ordersService.markInProgress(id, req.user.id);
  }

  /** POST /orders/:id/deliver */
  @Post(':id/deliver')
  markDelivered(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() body: DeliverDto,
  ) {
    return this.ordersService.markDelivered(id, req.user.id, body.deliveryNote);
  }

  /** POST /orders/:id/complete */
  @Post(':id/complete')
  markCompleted(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() body: CompleteDto,
  ) {
    return this.ordersService.markCompleted(id, req.user.id, body.escrowReleaseTx);
  }

  /** POST /orders/:id/dispute */
  @Post(':id/dispute')
  dispute(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() body: DisputeDto,
  ) {
    return this.ordersService.dispute(id, req.user.id, {
      txHash: body.txHash,
      reason: body.reason,
    });
  }

  /** POST /orders/:id/messages */
  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() body: SendMessageDto,
  ) {
    return this.ordersService.sendMessage(id, req.user.id, body.content);
  }
}
