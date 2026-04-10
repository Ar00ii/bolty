import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { DmService } from './dm.service';

@Controller('dm')
@UseGuards(JwtAuthGuard)
export class DmController {
  constructor(private readonly dmService: DmService) {}

  @Get('unread-count')
  async getUnreadCount(@CurrentUser('id') userId: string): Promise<{ count: number }> {
    const count = await this.dmService.getTotalUnread(userId);
    return { count };
  }
}
