import { Controller, Get, Header, Post, Param, Query, UseGuards, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** GET /notifications?unread=1&take=30 */
  @Get()
  list(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Query('unread') unread?: string,
    @Query('take') take?: string,
  ) {
    return this.notifications.list(req.user.id, {
      unreadOnly: unread === '1' || unread === 'true',
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  /** GET /notifications/unread-count
   *
   *  Browser caches the badge count for 20s. Combined with the 30s
   *  Redis cache in the service, rapid page navigation never pays
   *  for a fresh prisma.count round-trip. The `private` directive
   *  keeps it out of any shared CDN cache (it's per-user). */
  @Header('Cache-Control', 'private, max-age=20')
  @Get('unread-count')
  async unreadCount(@Request() req: ExpressRequest & { user: { id: string } }) {
    const count = await this.notifications.unreadCount(req.user.id);
    return { count };
  }

  /** POST /notifications/:id/read */
  @Post(':id/read')
  markRead(@Param('id') id: string, @Request() req: ExpressRequest & { user: { id: string } }) {
    return this.notifications.markRead(id, req.user.id);
  }

  /** POST /notifications/read-all */
  @Post('read-all')
  markAllRead(@Request() req: ExpressRequest & { user: { id: string } }) {
    return this.notifications.markAllRead(req.user.id);
  }
}
