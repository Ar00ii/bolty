import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  IsString,
  IsIn,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ReposService } from './repos.service';
import { Request } from 'express';

class PublishRepoDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsNumber()
  @Type(() => Number)
  stargazers_count: number;

  @IsNumber()
  @Type(() => Number)
  forks_count: number;

  @IsString()
  @IsNotEmpty()
  html_url: string;

  @IsString()
  @IsNotEmpty()
  clone_url: string;

  @IsOptional()
  topics?: string[];

  @IsBoolean()
  @IsOptional()
  private?: boolean;

  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  @Type(() => Number)
  lockedPriceUsd?: number;
}

class PurchaseRepoDto {
  @IsString()
  @IsNotEmpty()
  txHash: string;

  @IsString()
  @IsOptional()
  platformFeeTxHash?: string;

  @IsString()
  @IsOptional()
  consentSignature?: string;

  @IsString()
  @IsOptional()
  consentMessage?: string;
}

class VoteDto {
  @IsString()
  @IsIn(['UP', 'DOWN'])
  value: 'UP' | 'DOWN';
}

class ListReposQuery {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['votes', 'stars', 'recent', 'downloads'])
  sortBy?: 'votes' | 'stars' | 'recent' | 'downloads';
}

@Controller('repos')
export class ReposController {
  constructor(private readonly reposService: ReposService) {}

  @Public()
  @Get()
  listRepos(@Query() query: ListReposQuery) {
    return this.reposService.listRepositories(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('github')
  async getMyGitHubRepos(
    @CurrentUser() user: { id: string; githubLogin: string | null },
    @Req() req: Request,
  ) {
    if (!user.githubLogin) {
      return { error: 'GitHub account not linked' };
    }
    const ghToken = req.cookies?.['gh_token'];
    return this.reposService.fetchGitHubRepos(user.githubLogin, ghToken, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('github/cache')
  async clearGitHubCache(
    @CurrentUser() user: { githubLogin: string | null },
  ) {
    if (!user.githubLogin) return { ok: true };
    await this.reposService.clearGitHubReposCache(user.githubLogin);
    return { ok: true };
  }

  @Public()
  @Get(':id')
  getRepo(@Param('id') id: string) {
    return this.reposService.getRepository(id);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 3600000 } })
  @Post('publish')
  publishRepo(
    @Body() dto: PublishRepoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.reposService.publishRepository(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 100, ttl: 3600000 } })
  @Post(':id/vote')
  vote(
    @Param('id') repoId: string,
    @Body() dto: VoteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.reposService.vote(userId, repoId, dto.value);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/vote')
  removeVote(
    @Param('id') repoId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.reposService.removeVote(userId, repoId);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @HttpCode(HttpStatus.CREATED)
  @Post(':id/purchase')
  purchaseRepo(
    @Param('id') repoId: string,
    @Body() dto: PurchaseRepoDto,
    @CurrentUser('id') buyerId: string,
  ) {
    return this.reposService.purchaseRepository(
      buyerId, repoId, dto.txHash,
      dto.platformFeeTxHash, dto.consentSignature, dto.consentMessage,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/purchased')
  checkPurchased(
    @Param('id') repoId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.reposService.checkPurchased(userId, repoId);
  }

  @Public()
  @Post(':id/download')
  trackDownload(@Param('id') repoId: string) {
    return this.reposService.trackDownload(repoId);
  }
}
