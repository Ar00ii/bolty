import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Type } from 'class-transformer';
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
import { Response } from 'express';
import { Request } from 'express';
import { diskStorage } from 'multer';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StepUpService } from '../auth/step-up.service';

import { ReposService } from './repos.service';

const LOGO_UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'logos');

// Only allow static raster images. SVG is deliberately excluded — an SVG
// served from the same origin can execute inline <script> and steal
// session cookies via stored XSS.
const ALLOWED_IMAGE_MIMETYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

class PublishRepoDto {
  @IsNumber()
  @Type(() => Number)
  id!: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsNumber()
  @Type(() => Number)
  stargazers_count!: number;

  @IsNumber()
  @Type(() => Number)
  forks_count!: number;

  @IsString()
  @IsNotEmpty()
  html_url!: string;

  @IsString()
  @IsNotEmpty()
  clone_url!: string;

  @IsOptional()
  topics?: string[];

  @IsBoolean()
  @IsOptional()
  private?: boolean;

  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  websiteUrl?: string;

  @IsString()
  @IsOptional()
  twitterUrl?: string;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  @Type(() => Number)
  lockedPriceUsd?: number;
}

class PurchaseRepoDto {
  @IsString()
  @IsNotEmpty()
  txHash!: string;

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

class RecoverPurchaseDto {
  @IsString()
  @IsNotEmpty()
  txHash!: string;

  @IsString()
  @IsOptional()
  sellerUsername?: string;
}

class VoteDto {
  @IsString()
  @IsIn(['UP', 'DOWN'])
  value!: 'UP' | 'DOWN';
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

/** Parse a comma-separated `ids` query param into a clean string array.
 *  Trims, dedupes, drops empties, caps at 100. Used by the bulk lookup
 *  endpoint so the FE can collapse N favorite-fetches into one. */
function parseIdList(raw: string | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const part of raw.split(',')) {
    const id = part.trim();
    if (id) seen.add(id);
    if (seen.size >= 100) break;
  }
  return [...seen];
}

@Controller('repos')
export class ReposController {
  constructor(
    private readonly reposService: ReposService,
    private readonly stepUp: StepUpService,
  ) {}

  @Public()
  // 5 min edge cache, 10 min stale-while-revalidate — paired with a
  // GH Actions cron (see .github/workflows/warm-cache.yml) that hits
  // the common default views every 5 min so real users always land
  // on a warm edge response.
  @Header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
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
  async clearGitHubCache(@CurrentUser() user: { githubLogin: string | null }) {
    if (!user.githubLogin) return { ok: true };
    await this.reposService.clearGitHubReposCache(user.githubLogin);
    return { ok: true };
  }

  /** Bulk lookup — favorites page hits this with the id list it has in
   *  localStorage, skipping the N-fetch fan-out the per-row /repos/:id
   *  pattern would otherwise create. Cap of 100 enforced by parseIdList.
   *  Public — same access level as /repos/:id. */
  @Public()
  @Header('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
  @Get('by-ids')
  getReposByIds(@Query('ids') ids?: string) {
    return this.reposService.getRepositoriesByIds(parseIdList(ids));
  }

  @Public()
  @Header('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
  @Get(':id')
  getRepo(@Param('id') id: string) {
    return this.reposService.getRepository(id);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 3600000 } })
  @Post('publish')
  publishRepo(@Body() dto: PublishRepoDto, @CurrentUser('id') userId: string) {
    return this.reposService.publishRepository(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 100, ttl: 3600000 } })
  @Post(':id/vote')
  vote(@Param('id') repoId: string, @Body() dto: VoteDto, @CurrentUser('id') userId: string) {
    return this.reposService.vote(userId, repoId, dto.value);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/vote')
  removeVote(@Param('id') repoId: string, @CurrentUser('id') userId: string) {
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
      buyerId,
      repoId,
      dto.txHash,
      dto.platformFeeTxHash,
      dto.consentSignature,
      dto.consentMessage,
    );
  }

  /**
   * Universal recovery endpoint for buyers whose on-chain payment never
   * landed a verified repoPurchase row. Accepts a txHash (and optionally
   * the seller's username) and auto-detects which locked repo the
   * payment was for, then runs the normal verify pipeline.
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 3600000 } })
  @Post('recover-purchase')
  recoverPurchase(@Body() dto: RecoverPurchaseDto, @CurrentUser('id') buyerId: string) {
    return this.reposService.recoverPurchaseByTxHash(buyerId, dto.txHash, dto.sellerUsername);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/purchased')
  checkPurchased(@Param('id') repoId: string, @CurrentUser('id') userId: string) {
    return this.reposService.checkPurchased(userId, repoId);
  }

  /**
   * Retry on-chain verification for a pending repo purchase. The buyer
   * provides the txHash of the payment they already made on-chain; we
   * re-run the receipt/transfer checks against the existing pending row.
   * No new payment is required. This is the escape hatch for users whose
   * first /purchase call failed due to RPC lag or a transient verification
   * error — their ETH is already with the seller, we just need to mark
   * the DB row verified so the buyer's library / orders / download work.
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 3600000 } })
  @Post(':id/verify')
  verifyPending(
    @Param('id') repoId: string,
    @Body() dto: PurchaseRepoDto,
    @CurrentUser('id') buyerId: string,
  ) {
    return this.reposService.purchaseRepository(
      buyerId,
      repoId,
      dto.txHash,
      dto.platformFeeTxHash,
      dto.consentSignature,
      dto.consentMessage,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 3600000 } })
  @Post(':id/download')
  trackDownload(@Param('id') repoId: string, @CurrentUser('id') userId: string) {
    return this.reposService.trackDownload(repoId, userId);
  }

  // ── Logo image upload (drag-and-drop, static images only) ────────────────

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @Post('upload-logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(LOGO_UPLOADS_DIR)) {
            fs.mkdirSync(LOGO_UPLOADS_DIR, { recursive: true });
          }
          cb(null, LOGO_UPLOADS_DIR);
        },
        filename: (_req, _file, cb) => {
          const key = crypto.randomUUID();
          cb(null, key);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_IMAGE_MIMETYPES.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only static raster images are allowed (PNG, JPG, WebP). SVGs, GIFs and other formats are not permitted.',
            ),
            false,
          );
        }
      },
    }),
  )
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return {
      logoKey: file.filename,
      logoUrl: `/api/v1/repos/logos/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  @Public()
  @Get('logos/:key')
  serveLogo(@Param('key') key: string, @Res() res: Response) {
    // Sanitize key — must be a UUID
    if (!/^[0-9a-f-]{36}$/.test(key)) {
      res.status(400).json({ message: 'Invalid logo key' });
      return;
    }
    const filePath = path.join(LOGO_UPLOADS_DIR, key);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'Logo not found' });
      return;
    }
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Defence-in-depth for legacy SVGs that may still be on disk from
    // before image/svg+xml was removed from the allowlist: nosniff blocks
    // browsers from treating a .svg-as-image/png as SVG, and the sandbox
    // CSP neutralises any inline <script> even if it does.
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
    res.sendFile(filePath, { headers: { 'Cache-Control': 'public, max-age=86400' } });
  }

  // ── Collaborators ─────────────────────────────────────────────────────────

  @Public()
  @Get(':id/collaborators')
  getCollaborators(@Param('id') repoId: string) {
    return this.reposService.getCollaborators(repoId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/collaborators')
  addCollaborator(
    @Param('id') repoId: string,
    @CurrentUser('id') userId: string,
    @Body()
    body: { targetUserId?: string; name?: string; type?: string; url?: string; role?: string },
  ) {
    return this.reposService.addCollaborator(userId, repoId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteRepo(@Param('id') repoId: string, @CurrentUser('id') userId: string) {
    return this.reposService.deleteRepository(userId, repoId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/collaborators/:collaboratorId')
  removeCollaborator(
    @Param('id') repoId: string,
    @Param('collaboratorId') collaboratorId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.reposService.removeCollaborator(userId, repoId, collaboratorId);
  }
}
