import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import {
  Controller,
  Get,
  Patch,
  Post,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { IsString, IsOptional, MaxLength, MinLength, Matches, IsUrl } from 'class-validator';
import { Response } from 'express';
import { diskStorage } from 'multer';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { UsersService } from './users.service';

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

  @IsOptional()
  @IsUrl({ require_protocol: false }, { message: 'Invalid Twitter URL' })
  @MaxLength(200)
  twitterUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: false }, { message: 'Invalid LinkedIn URL' })
  @MaxLength(200)
  linkedinUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: false }, { message: 'Invalid website URL' })
  @MaxLength(200)
  websiteUrl?: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    try {
      return await this.usersService.updateProfile(userId, dto);
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
      limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB max
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
    const avatarUrl = `/api/v1/users/avatars/${file.filename}`;
    await this.usersService.updateProfile(userId, { avatarUrl });
    return { avatarUrl };
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

  @Public()
  @Get(':username')
  getUserProfile(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }
}
