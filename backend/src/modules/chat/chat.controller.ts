import { Controller, Get, Post, Body, Param, UseGuards, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, Length } from 'class-validator';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { ChatService, FEED_CHANNELS } from './chat.service';

class ReportDto {
  @IsString()
  @Length(5, 500)
  reason!: string;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('channels')
  getChannels() {
    return { channels: FEED_CHANNELS };
  }

  @Get('messages')
  async getMessages(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('channel') channel?: string,
  ) {
    const parsedLimit = Math.min(parseInt(limit || '50', 10) || 50, 100);
    const messages = await this.chatService.getRecentMessages(parsedLimit, undefined, channel);
    const liked = await this.chatService.likedMessageIds(
      messages.map((m) => m.id),
      userId,
    );
    return messages.map((m) => ({ ...m, likedByMe: liked.has(m.id) }));
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('messages/:id/report')
  reportMessage(
    @Param('id') messageId: string,
    @Body() dto: ReportDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.reportMessage(messageId, userId, dto.reason);
  }

  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Post('messages/:id/like')
  @HttpCode(HttpStatus.OK)
  toggleLike(@Param('id') messageId: string, @CurrentUser('id') userId: string) {
    return this.chatService.toggleLike(messageId, userId);
  }
}
