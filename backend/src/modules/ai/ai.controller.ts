import { Controller, Post, Get, Body, Param, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, Length } from 'class-validator';
import { Response } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { AiService } from './ai.service';

class ChatDto {
  @IsString()
  @Length(1, 2000)
  message!: string;
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('sessions')
  createSession(@CurrentUser('id') userId: string) {
    return this.aiService.createSession(userId);
  }

  @Get('sessions')
  getSessions(@CurrentUser('id') userId: string) {
    return this.aiService.getSessions(userId);
  }

  @Get('sessions/:id')
  getSession(@Param('id') sessionId: string, @CurrentUser('id') userId: string) {
    return this.aiService.getSession(sessionId, userId);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('sessions/:id/chat')
  async chat(
    @Param('id') sessionId: string,
    @Body() dto: ChatDto,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    await this.aiService.streamChat(userId, sessionId, dto.message, res);
  }
}
