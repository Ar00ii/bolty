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
import { NegotiationService } from './negotiation.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { isSafeUrl } from '../../common/sanitize/sanitize.util';

interface CreateListingBody {
  title: string;
  description: string;
  type: 'REPO' | 'BOT' | 'SCRIPT' | 'AI_AGENT' | 'OTHER';
  price: number;
  currency?: string;
  tags?: string[];
  repositoryId?: string;
  agentUrl?: string;
  agentEndpoint?: string;
  fileKey?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
}

interface SendMessageBody {
  content: string;
  proposedPrice?: number;
}

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'market');

const ALLOWED_MIMETYPES = new Set([
  'text/plain', 'text/x-python', 'text/javascript', 'application/javascript',
  'text/typescript', 'application/json', 'application/zip',
  'application/x-zip-compressed', 'application/x-zip', 'text/x-yaml',
  'application/x-yaml', 'text/yaml', 'text/x-sh', 'text/x-shellscript',
  'application/x-sh', 'application/x-python', 'text/markdown', 'text/csv',
  'application/toml', 'text/x-toml',
]);

@Controller('market')
export class MarketController {
  constructor(
    private readonly marketService: MarketService,
    private readonly negotiationService: NegotiationService,
  ) {}

  // ── Listings ───────────────────────────────────────────────────────────────

  @Public()
  @Get()
  getListings(
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
  ) {
    return this.marketService.getListings({ type, search, page: page ? Number(page) : 1 });
  }

  // Must be defined before :id to avoid route clash
  @Public()
  @Get('files/:key')
  async serveFile(@Param('key') key: string, @Res() res: Response) {
    if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/.test(key)) {
      throw new NotFoundException();
    }
    const filePath = path.join(UPLOADS_DIR, key);
    if (!fs.existsSync(filePath)) throw new NotFoundException('File not found');
    const meta = await this.marketService.getListingByFileKey(key);
    res.setHeader('Content-Disposition', `attachment; filename="${(meta?.fileName || key).replace(/"/g, '_')}"`);
    res.setHeader('Content-Type', meta?.fileMimeType || 'application/octet-stream');
    res.sendFile(filePath);
  }

  @Get('negotiations')
  getMyNegotiations(@CurrentUser('id') userId: string) {
    return this.negotiationService.getMyNegotiations(userId);
  }

  @Get('negotiations/:id')
  getNegotiation(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.negotiationService.getNegotiation(id, userId);
  }

  @Public()
  @Get(':id')
  getListing(@Param('id') id: string) {
    return this.marketService.getListing(id);
  }

  // ── Create / delete listings ───────────────────────────────────────────────

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          fs.mkdirSync(UPLOADS_DIR, { recursive: true });
          cb(null, UPLOADS_DIR);
        },
        filename: (req, file, cb) => cb(null, crypto.randomUUID()),
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
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
    return { fileKey: file.filename, fileName: file.originalname, fileSize: file.size, fileMimeType: file.mimetype };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createListing(@CurrentUser('id') userId: string, @Body() body: CreateListingBody) {
    // Validate agentEndpoint if provided
    if (body.agentEndpoint && !isSafeUrl(body.agentEndpoint)) {
      throw new BadRequestException('Invalid or unsafe agent endpoint URL');
    }
    return this.marketService.createListing(userId, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteListing(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.marketService.deleteListing(id, userId);
  }

  // ── Negotiations ───────────────────────────────────────────────────────────

  @Post(':listingId/negotiate')
  startNegotiation(
    @Param('listingId') listingId: string,
    @CurrentUser('id') buyerId: string,
  ) {
    return this.negotiationService.startNegotiation(buyerId, listingId);
  }

  @Post('negotiations/:id/message')
  sendMessage(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: SendMessageBody,
  ) {
    if (!body.content?.trim()) throw new BadRequestException('Message content required');
    return this.negotiationService.sendMessage(id, userId, body.content, body.proposedPrice);
  }

  @Post('negotiations/:id/accept')
  acceptDeal(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.negotiationService.acceptDeal(id, userId);
  }

  @Post('negotiations/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectDeal(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.negotiationService.rejectDeal(id, userId);
  }
}
