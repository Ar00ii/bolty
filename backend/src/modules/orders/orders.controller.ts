import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** GET /orders — orders where I'm the buyer */
  @Get()
  getBuyerOrders(@Request() req: any) {
    return this.ordersService.getBuyerOrders(req.user.id);
  }

  /** GET /orders/selling — orders where I'm the seller */
  @Get('selling')
  getSellerOrders(@Request() req: any) {
    return this.ordersService.getSellerOrders(req.user.id);
  }

  /** GET /orders/seller/stats */
  @Get('seller/stats')
  getSellerStats(@Request() req: any) {
    return this.ordersService.getSellerStats(req.user.id);
  }

  /** GET /orders/:id */
  @Get(':id')
  getOrder(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.getOrder(id, req.user.id);
  }

  /** GET /orders/:id/messages */
  @Get(':id/messages')
  getMessages(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.getMessages(id, req.user.id);
  }

  /** POST /orders/:id/in-progress */
  @Post(':id/in-progress')
  markInProgress(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.markInProgress(id, req.user.id);
  }

  /** POST /orders/:id/deliver */
  @Post(':id/deliver')
  markDelivered(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { deliveryNote?: string },
  ) {
    return this.ordersService.markDelivered(id, req.user.id, body.deliveryNote);
  }

  /** POST /orders/:id/complete */
  @Post(':id/complete')
  markCompleted(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.markCompleted(id, req.user.id);
  }

  /** POST /orders/:id/dispute */
  @Post(':id/dispute')
  dispute(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.dispute(id, req.user.id);
  }

  /** POST /orders/:id/messages */
  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { content: string },
  ) {
    return this.ordersService.sendMessage(id, req.user.id, body.content);
  }
}
