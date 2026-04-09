import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, Length } from 'class-validator';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { ChatService } from './chat.service';

class ReportDto {
  @IsString()
  @Length(5, 500)
  reason!: string;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages')
  getMessages(@Query('limit') limit?: string) {
    const parsedLimit = Math.min(parseInt(limit || '50', 10) || 50, 100);
    return this.chatService.getRecentMessages(parsedLimit);
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
}
