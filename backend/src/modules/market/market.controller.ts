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
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { isSafeUrl } from '../../common/sanitize/sanitize.util';

import { AgentScanService } from './agent-scan.service';
import { ApiKeysService } from './api-keys.service';
import { MarketService } from './market.service';
import { NegotiationService } from './negotiation.service';

interface CreateListingBody {
  title: string;
  description: string;
  type: 'REPO' | 'BOT' | 'SCRIPT' | 'AI_AGENT' | 'OTHER';
  price: number;
  currency?: string;
  minPrice?: number;
  tags?: string[];
  repositoryId?: string;
  agentUrl?: string;
  agentEndpoint?: string;
  fileKey?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
}

interface PurchaseListingBody {
  txHash: string;
  amountWei: string;
  negotiationId?: string;
  platformFeeTxHash?: string;
  consentSignature?: string;
  consentMessage?: string;
  escrowContract?: string;
}

interface SendMessageBody {
  content: string;
  proposedPrice?: number;
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

@UseGuards(JwtAuthGuard)
@Controller('market')
export class MarketController {
  constructor(
    private readonly marketService: MarketService,
    private readonly negotiationService: NegotiationService,
    private readonly agentScanService: AgentScanService,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  // ── API Keys ───────────────────────────────────────────────────────────────

  @Get('api-keys')
  getApiKeys(@CurrentUser('id') userId: string) {
    return this.apiKeysService.getUserApiKeys(userId);
  }

  @Post('api-keys')
  @HttpCode(HttpStatus.CREATED)
  createApiKey(@CurrentUser('id') userId: string, @Body() body: { label?: string | null }) {
    return this.apiKeysService.createApiKey(userId, body.label || null);
  }

  @Post('api-keys/:id/request-delete-verification')
  requestDeleteVerification(
    @Param('id') keyId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.apiKeysService.requestDeleteVerification(userId, keyId, userEmail);
  }

  @Delete('api-keys/:id')
  @HttpCode(HttpStatus.OK)
  async deleteApiKey(
    @Param('id') keyId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { code: string },
  ) {
    return this.apiKeysService.verifyAndDeleteApiKey(userId, keyId, body.code);
  }

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
  // Protected: only users who purchased the listing can download
  @Get('files/:key')
  async serveFile(
    @Param('key') key: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/.test(key)) {
      throw new NotFoundException();
    }
    const filePath = path.join(UPLOADS_DIR, key);
    // Ensure resolved path stays within uploads directory (path traversal protection)
    if (!path.resolve(filePath).startsWith(path.resolve(UPLOADS_DIR))) {
      throw new NotFoundException();
    }
    if (!fs.existsSync(filePath)) throw new NotFoundException('File not found');
    const meta = await this.marketService.getListingByFileKey(key);
    if (!meta) throw new NotFoundException('Listing not found');

    // Security: Verify user purchased this listing before allowing download
    const hasPurchased = await this.marketService.userHasPurchasedListing(meta.id, userId);
    if (!hasPurchased) {
      throw new ForbiddenException('You do not have access to this file. Purchase the listing first.');
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${(meta.fileName || key).replace(/"/g, '_')}"`,
    );
    res.setHeader('Content-Type', meta.fileMimeType || 'application/octet-stream');
    res.sendFile(filePath);
  }

  @Get('negotiations')
  getMyNegotiations(@CurrentUser('id') userId: string) {
    return this.negotiationService.getMyNegotiations(userId);
  }

  @Get('negotiations/:id')
  getNegotiation(@Param('id') id: string, @CurrentUser('id') userId: string) {
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
        destination: (_req, _file, cb) => {
          fs.mkdirSync(UPLOADS_DIR, { recursive: true });
          cb(null, UPLOADS_DIR);
        },
        filename: (_req, _file, cb) => cb(null, crypto.randomUUID()),
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMETYPES.has(file.mimetype) || file.mimetype.startsWith('text/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`File type not allowed: ${file.mimetype}`), false);
        }
      },
    }),
  )
  async uploadFile(@CurrentUser('id') _userId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file received');
    const scan = await this.agentScanService.scan(file.filename, file.originalname);
    return {
      fileKey: file.filename,
      fileName: file.originalname,
      fileSize: file.size,
      fileMimeType: file.mimetype,
      scanPassed: scan.passed,
      scanNote: scan.note,
    };
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

  @Post(':id/purchase')
  @HttpCode(HttpStatus.CREATED)
  purchaseListing(
    @Param('id') id: string,
    @CurrentUser('id') buyerId: string,
    @Body() body: PurchaseListingBody,
  ) {
    if (!body.txHash?.trim()) throw new BadRequestException('txHash required');
    return this.marketService.purchaseListing(
      id,
      buyerId,
      body.txHash,
      body.amountWei || '0',
      body.negotiationId,
      body.platformFeeTxHash,
      body.consentSignature,
      body.consentMessage,
      body.escrowContract,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteListing(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.marketService.deleteListing(id, userId);
  }

  // ── Negotiations ───────────────────────────────────────────────────────────

  @Post(':listingId/negotiate')
  startNegotiation(@Param('listingId') listingId: string, @CurrentUser('id') buyerId: string) {
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

  /**
   * Request switching from AI-vs-AI to human negotiation.
   * The other party must call /accept-human to confirm (Pokemon trade handshake).
   */
  @Post('negotiations/:id/request-human')
  requestHumanSwitch(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.negotiationService.requestHumanSwitch(id, userId);
  }

  /**
   * Accept the pending human-mode switch request from the other party.
   * Once accepted, both users can type freely.
   */
  @Post('negotiations/:id/accept-human')
  acceptHumanSwitch(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.negotiationService.acceptHumanSwitch(id, userId);
  }
}
