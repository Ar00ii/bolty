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
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, IsIn, IsOptional, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ReposService } from './repos.service';
import { Request } from 'express';

class PublishRepoDto {
  @IsNumber()
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
  stargazers_count: number;

  @IsNumber()
  forks_count: number;

  @IsString()
  @IsNotEmpty()
  html_url: string;

  @IsString()
  @IsNotEmpty()
  clone_url: string;

  topics?: string[];
  private: boolean;
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
    @CurrentUser() user: { githubLogin: string | null },
    @Req() req: Request,
  ) {
    if (!user.githubLogin) {
      return { error: 'GitHub account not linked' };
    }
    const ghToken = req.cookies?.['gh_token'];
    return this.reposService.fetchGitHubRepos(user.githubLogin, ghToken);
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

  @Public()
  @Post(':id/download')
  trackDownload(@Param('id') repoId: string) {
    return this.reposService.trackDownload(repoId);
  }
}
