import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ConflictException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
  ValidateIf,
  IsUrl,
} from 'class-validator';
import { Response } from 'express';
import { diskStorage } from 'multer';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StepUpService } from '../auth/step-up.service';

import { UsersService } from './users.service';
import { WalletsService } from './wallets.service';

const AVATAR_UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'avatars');
const ALLOWED_IMAGE_MIMETYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain letters, numbers, _ and -' })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  bio?: string;

  // URL fields accept `null` or empty string to clear the link. `@ValidateIf`
  // skips URL validation when the value is falsy so the backend persists the
  // removal instead of rejecting the payload with "Invalid URL".
  @IsOptional()
  @ValidateIf((_obj, value) => value !== null && value !== '')
  @IsUrl({ require_protocol: false }, { message: 'Invalid Twitter URL' })
  @MaxLength(200)
  twitterUrl?: string | null;

  @IsOptional()
  @ValidateIf((_obj, value) => value !== null && value !== '')
  @IsUrl({ require_protocol: false }, { message: 'Invalid LinkedIn URL' })
  @MaxLength(200)
  linkedinUrl?: string | null;

  @IsOptional()
  @ValidateIf((_obj, value) => value !== null && value !== '')
  @IsUrl({ require_protocol: false }, { message: 'Invalid website URL' })
  @MaxLength(200)
  websiteUrl?: string | null;

  // Optional 6-digit TOTP code, required when the user has 2FA enabled and is
  // changing their username (the only field that affects their public identity).
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/)
  twoFactorCode?: string;
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly stepUp: StepUpService,
    private readonly config: ConfigService,
    private readonly walletsService: WalletsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    // Step-up auth required when changing the public handle (username).
    if (dto.username !== undefined) {
      await this.stepUp.assert(userId, dto.twoFactorCode);
    }
    const { twoFactorCode: _drop, ...payload } = dto;
    try {
      return await this.usersService.updateProfile(userId, payload);
    } catch (err: unknown) {
      // Prisma unique constraint violation (P2002)
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        const target = (err as { meta?: { target?: string[] } }).meta?.target;
        if (target?.includes('username')) throw new ConflictException('Username already taken');
        throw new ConflictException('This value is already in use');
      }
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @Post('upload-avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(AVATAR_UPLOADS_DIR)) {
            fs.mkdirSync(AVATAR_UPLOADS_DIR, { recursive: true });
          }
          cb(null, AVATAR_UPLOADS_DIR);
        },
        filename: (_req, _file, cb) => {
          cb(null, crypto.randomUUID());
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_IMAGE_MIMETYPES.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PNG, JPG or WebP images are allowed.'), false);
        }
      },
    }),
  )
  async uploadAvatar(@CurrentUser('id') userId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    // Store an absolute URL so `<img src>` resolves against the backend origin,
    // not the frontend's. Fixes avatars disappearing on reload when frontend
    // and backend live on different origins.
    const appUrl = (this.config.get<string>('APP_URL') || '').replace(/\/+$/, '');
    const avatarUrl = appUrl
      ? `${appUrl}/api/v1/users/avatars/${file.filename}`
      : `/api/v1/users/avatars/${file.filename}`;
    await this.usersService.updateProfile(userId, { avatarUrl });
    return { avatarUrl };
  }

  @Public()
  @Get('community')
  getCommunity(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : 6;
    return this.usersService.getCommunityShowcase(Number.isFinite(parsed) ? parsed : 6);
  }

  @Public()
  @Get('avatars/:key')
  serveAvatar(@Param('key') key: string, @Res() res: Response) {
    if (!/^[0-9a-f-]{36}$/.test(key)) {
      res.status(400).json({ message: 'Invalid key' });
      return;
    }
    const filePath = path.join(AVATAR_UPLOADS_DIR, key);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(filePath);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  searchUsers(@Query('q') q: string) {
    return this.usersService.search(q || '');
  }

  @UseGuards(JwtAuthGuard)
  @Get('preferences/notifications')
  getNotificationPreferences(@CurrentUser('id') userId: string) {
    return this.usersService.getNotificationPreferences(userId);
  }

  /** Privacy toggles surfaced in /profile → Friends → Privacy. */
  @UseGuards(JwtAuthGuard)
  @Get('preferences/privacy')
  getPrivacy(@CurrentUser('id') userId: string) {
    return this.usersService.getPrivacy(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('preferences/privacy')
  updatePrivacy(
    @CurrentUser('id') userId: string,
    @Body() data: { friendRequestsEnabled?: boolean; publicMessagesEnabled?: boolean },
  ) {
    return this.usersService.updatePrivacy(userId, data);
  }

  /** Suggested users to befriend — used by the Friends → Suggested tab.
   *  Returns a small list mixing high-reputation users + recently
   *  active users + a few random faces. Excludes the caller and people
   *  they already friend / have a pending request with. Public so
   *  anonymous discovery still works on the public showcase. */
  @UseGuards(JwtAuthGuard)
  @Get('suggested')
  getSuggested(@CurrentUser('id') userId: string, @Query('limit') limit?: string) {
    const lim = Math.max(1, Math.min(Number(limit) || 12, 24));
    return this.usersService.getSuggested(userId, lim);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('preferences/notifications')
  updateNotificationPreferences(
    @CurrentUser('id') userId: string,
    @Body()
    data: {
      emailOnErrors?: boolean;
      emailWeeklyReport?: boolean;
      emailMonthlyReport?: boolean;
      emailDeploymentAlerts?: boolean;
      emailOrderUpdates?: boolean;
      emailMessages?: boolean;
    },
  ) {
    return this.usersService.updateNotificationPreferences(userId, data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('activity-log')
  getActivityLog(@CurrentUser('id') userId: string, @Query('limit') limit?: string) {
    return this.usersService.getActivityLog(userId, limit ? parseInt(limit) : 50);
  }

  @UseGuards(JwtAuthGuard)
  @Get('usage-stats')
  getUsageStats(@CurrentUser('id') userId: string) {
    return this.usersService.getUsageStats(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('integrations')
  getUserIntegrations(@CurrentUser('id') userId: string) {
    return this.usersService.getUserIntegrations(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('integrations')
  addIntegration(
    @CurrentUser('id') userId: string,
    @Body() body: { provider: string; name: string; connectedAs?: string },
  ) {
    return this.usersService.addIntegration(userId, body.provider, body.name, body.connectedAs);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('integrations/:id')
  removeIntegration(@CurrentUser('id') userId: string, @Param('id') integrationId: string) {
    return this.usersService.removeIntegration(userId, integrationId);
  }

  // ── Linked wallets ────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('wallets')
  listWallets(@CurrentUser('id') userId: string) {
    return this.walletsService.listWallets(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('wallets/:id')
  removeWallet(@CurrentUser('id') userId: string, @Param('id') walletId: string) {
    return this.walletsService.removeWallet(userId, walletId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('wallets/:id/primary')
  setPrimaryWallet(@CurrentUser('id') userId: string, @Param('id') walletId: string) {
    return this.walletsService.setPrimary(userId, walletId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('wallets/:id')
  updateWalletLabel(
    @CurrentUser('id') userId: string,
    @Param('id') walletId: string,
    @Body() body: { label?: string | null },
  ) {
    return this.walletsService.updateLabel(userId, walletId, body?.label ?? null);
  }

  @Public()
  @Get(':username')
  getUserProfile(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }
}
