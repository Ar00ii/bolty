import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { WalletAuthService } from './wallet-auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { GetNonceDto, VerifyEthereumDto } from './dto/wallet-auth.dto';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly walletAuthService: WalletAuthService,
    private readonly config: ConfigService,
  ) {}

  // ── GitHub OAuth ──────────────────────────────────────────────────────────

  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {
    // Passport redirects to GitHub
  }

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(
    @Req() req: Request & { user: { id: string; login: string; avatar_url: string; bio?: string; accessToken: string } },
    @Res() res: Response,
  ) {
    const tokens = await this.authService.handleGitHubCallback({
      id: req.user.id,
      login: req.user.login,
      avatar_url: req.user.avatar_url,
      bio: req.user.bio,
    });

    // Set HttpOnly cookies
    res.cookie('access_token', tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Store GitHub access token in session for repo fetching
    res.cookie('gh_token', req.user.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    res.redirect(`${frontendUrl}/auth/success`);
  }

  // ── MetaMask ──────────────────────────────────────────────────────────────

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('nonce/ethereum')
  async getEthereumNonce(@Body() dto: GetNonceDto) {
    return this.walletAuthService.getNonce(dto.address);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify/ethereum')
  async verifyEthereum(
    @Body() dto: VerifyEthereumDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const tokens = await this.walletAuthService.verifyEthereum(
      dto.address,
      dto.signature,
      dto.nonce,
      req.ip,
    );

    res.cookie('access_token', tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true });
  }

  // ── Token Refresh ─────────────────────────────────────────────────────────

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.['refresh_token'];
    const accessToken = req.cookies?.['access_token'];

    if (!refreshToken || !accessToken) {
      throw new UnauthorizedException('No tokens provided');
    }

    let payload: { sub: string };
    try {
      payload = await this.authService.validateToken(accessToken).catch(() => {
        // Access token might be expired — decode without verification just to get sub
        const parts = accessToken.split('.');
        if (parts.length !== 3) throw new Error('Invalid token');
        return JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as { sub: string };
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const tokens = await this.authService.refreshAccessToken(payload.sub, refreshToken);

    res.cookie('access_token', tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true });
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    await this.authService.revokeAllTokens(userId);

    res.clearCookie('access_token', COOKIE_OPTIONS);
    res.clearCookie('refresh_token', COOKIE_OPTIONS);
    res.clearCookie('gh_token', COOKIE_OPTIONS);

    return res.json({ success: true });
  }

  // ── Me ────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: unknown) {
    return user;
  }
}
