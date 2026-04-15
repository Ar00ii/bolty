import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtOrApiKey } from '../../common/decorators/jwt-or-api-key.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { AgentPostsService } from './agent-posts.service';

interface CreatePostBody {
  content: string;
  postType?: 'GENERAL' | 'PRICE_UPDATE' | 'ANNOUNCEMENT' | 'DEAL';
  price?: number;
  currency?: string;
}

@Controller('market')
export class AgentPostsController {
  constructor(private readonly agentPostsService: AgentPostsService) {}

  // ── Global feed (public) ───────────────────────────────────────────────────

  @Public()
  @Get('feed')
  getGlobalFeed(@Query('take') take?: string) {
    return this.agentPostsService.getGlobalFeed(Math.min(Number(take) || 30, 100));
  }

  // ── Posts for a specific agent (public) ───────────────────────────────────

  @Public()
  @Get(':id/posts')
  getAgentPosts(
    @Param('id') listingId: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.agentPostsService.getPostsForListing(
      listingId,
      Math.min(Number(take) || 50, 100),
      Number(skip) || 0,
    );
  }

  // ── Create post (JWT owner OR API key) ────────────────────────────────────
  // Accepts authentication via either JWT (user) or API key (automated agent).
  // Validates that the requester is authorized to post on this agent's behalf.

  @JwtOrApiKey()
  @Post(':id/posts')
  async createPost(
    @Param('id') listingId: string,
    @Body() body: CreatePostBody,
    @CurrentUser('id') userId: string | undefined,
    @Headers('x-agent-key') apiKey?: string,
  ) {
    // Must have either JWT or API key (checked by @JwtOrApiKey decorator)
    if (!userId && !apiKey) {
      throw new UnauthorizedException('Provide a JWT token or an x-agent-key header');
    }

    // API key authentication path
    if (apiKey) {
      await this.agentPostsService.validateApiKey(apiKey, listingId);
      return this.agentPostsService.createPost(
        listingId,
        null,
        body.content,
        body.postType,
        body.price,
        body.currency,
      );
    }

    // JWT authentication path
    return this.agentPostsService.createPost(
      listingId,
      userId!,
      body.content,
      body.postType,
      body.price,
      body.currency,
    );
  }

  // ── API key management ─────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get(':id/apikeys')
  listApiKeys(@Param('id') listingId: string, @CurrentUser('id') userId: string) {
    return this.agentPostsService.listApiKeys(listingId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/apikeys')
  generateApiKey(
    @Param('id') listingId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { label?: string },
  ) {
    return this.agentPostsService.generateApiKey(listingId, userId, body.label);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('apikeys/:keyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeApiKey(@Param('keyId') keyId: string, @CurrentUser('id') userId: string) {
    return this.agentPostsService.revokeApiKey(keyId, userId);
  }
}
