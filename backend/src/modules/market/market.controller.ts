import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { MarketService } from './market.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

interface CreateListingBody {
  title: string;
  description: string;
  type: 'REPO' | 'BOT' | 'SCRIPT' | 'AI_AGENT' | 'OTHER';
  price: number;
  currency?: string;
  tags?: string[];
  repositoryId?: string;
  agentUrl?: string;
  fileKey?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
}

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'market');

const ALLOWED_MIMETYPES = new Set([
  'text/plain',
  'text/x-python',
  'text/javascript',
  'application/javascript',
  'text/typescript',
  'application/json',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'text/x-yaml',
  'application/x-yaml',
  'text/yaml',
  'text/x-sh',
  'text/x-shellscript',
  'application/x-sh',
  'application/x-python',
  'text/markdown',
  'text/csv',
  'application/toml',
  'text/x-toml',
]);

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Public()
  @Get()
  getListings(
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
  ) {
    return this.marketService.getListings({ type, search, page: page ? Number(page) : 1 });
  }

  // Must be before :id to avoid route clash
  @Public()
  @Get('files/:key')
  async serveFile(
    @Param('key') key: string,
    @Res() res: Response,
  ) {
    // Only allow UUID-shaped keys — prevents path traversal
    if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/.test(key)) {
      throw new NotFoundException();
    }
    const filePath = path.join(UPLOADS_DIR, key);
    if (!fs.existsSync(filePath)) throw new NotFoundException('File not found');

    const meta = await this.marketService.getListingByFileKey(key);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${(meta?.fileName || key).replace(/"/g, '_')}"`,
    );
    res.setHeader('Content-Type', meta?.fileMimeType || 'application/octet-stream');
    res.sendFile(filePath);
  }

  @Public()
  @Get(':id')
  getListing(@Param('id') id: string) {
    return this.marketService.getListing(id);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          fs.mkdirSync(UPLOADS_DIR, { recursive: true });
          cb(null, UPLOADS_DIR);
        },
        filename: (req, file, cb) => {
          cb(null, crypto.randomUUID());
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (req, file, cb) => {
        if (ALLOWED_MIMETYPES.has(file.mimetype) || file.mimetype.startsWith('text/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`File type not allowed: ${file.mimetype}`), false);
        }
      },
    }),
  )
  uploadFile(
    @CurrentUser('id') _userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file received');
    return {
      fileKey: file.filename,
      fileName: file.originalname,
      fileSize: file.size,
      fileMimeType: file.mimetype,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createListing(
    @CurrentUser('id') userId: string,
    @Body() body: CreateListingBody,
  ) {
    return this.marketService.createListing(userId, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteListing(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.marketService.deleteListing(id, userId);
  }
}
