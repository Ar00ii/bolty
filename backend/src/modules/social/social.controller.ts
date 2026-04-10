import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsString, IsBoolean } from 'class-validator';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { SocialService } from './social.service';

class SendRequestDto {
  @IsString()
  targetId!: string;
}

class RespondDto {
  @IsBoolean()
  accept!: boolean;
}

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('friends')
  getFriends(@CurrentUser('id') userId: string) {
    return this.socialService.getFriends(userId);
  }

  @Get('friends/requests')
  getPendingRequests(@CurrentUser('id') userId: string) {
    return this.socialService.getPendingRequests(userId);
  }

  @Get('friends/sent')
  getSentRequests(@CurrentUser('id') userId: string) {
    return this.socialService.getSentRequests(userId);
  }

  @Get('friends/status/:targetId')
  getStatus(@CurrentUser('id') userId: string, @Param('targetId') targetId: string) {
    return this.socialService.getFriendshipStatus(userId, targetId);
  }

  @Post('friends/request')
  @HttpCode(HttpStatus.OK)
  sendRequest(@CurrentUser('id') userId: string, @Body() dto: SendRequestDto) {
    return this.socialService.sendFriendRequest(userId, dto.targetId);
  }

  @Post('friends/respond/:requestId')
  @HttpCode(HttpStatus.OK)
  respond(
    @CurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
    @Body() dto: RespondDto,
  ) {
    return this.socialService.respondToRequest(userId, requestId, dto.accept);
  }

  @Delete('friends/:targetId')
  @HttpCode(HttpStatus.OK)
  unfriend(@CurrentUser('id') userId: string, @Param('targetId') targetId: string) {
    return this.socialService.unfriend(userId, targetId);
  }
}
