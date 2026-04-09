import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import {
  ReputationService,
  RANK_META,
  RANK_THRESHOLDS,
  ReputationRank,
  RANK_POINTS,
} from './reputation.service';

@UseGuards(JwtAuthGuard)
@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Public()
  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: string) {
    return this.reputationService.getLeaderboard(limit ? Math.min(parseInt(limit, 10), 100) : 20);
  }

  @Public()
  @Get('ranks')
  getRanks() {
    return Object.values(ReputationRank).map((rank) => ({
      rank,
      ...RANK_META[rank],
      threshold: RANK_THRESHOLDS[rank],
    }));
  }

  @Public()
  @Get('points-info')
  getPointsInfo() {
    return Object.entries(RANK_POINTS).map(([reason, points]) => ({ reason, points }));
  }

  @Get('me')
  async getMyReputation(@CurrentUser('id') userId: string) {
    return this.reputationService.getUserReputation(userId);
  }

  @Public()
  @Get('user/:userId')
  async getUserReputation(@Param('userId') userId: string) {
    return this.reputationService.getUserReputation(userId);
  }
}
