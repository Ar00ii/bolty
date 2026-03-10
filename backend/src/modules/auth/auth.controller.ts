import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
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
import { RegisterEmailDto, LoginEmailDto } from './dto/email-auth.dto';

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

  // ── Email / Password Auth ─────────────────────────────────────────────────

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(@Body() dto: RegisterEmailDto, @Res() res: Response) {
    const tokens = await this.authService.registerWithEmail({
      email: dto.email,
      username: dto.username,
      password: dto.password,
    });

    res.cookie('access_token', tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(HttpStatus.CREATED).json({ success: true });
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login/email')
  async loginEmail(@Body() dto: LoginEmailDto, @Res() res: Response) {
    const tokens = await this.authService.loginWithEmail({
      email: dto.email,
      password: dto.password,
    });

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
    @Req() req: Request & { user: { id: string; login: string; avatar_url: string; bio?: string; accessToken: string }; cookies: Record<string, string> },
    @Res() res: Response,
  ) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');

    // If user is already authenticated → link GitHub to existing account
    const existingToken = (req as unknown as { cookies: Record<string, string> }).cookies?.['access_token'];
    if (existingToken) {
      try {
        const payload = await this.authService.validateToken(existingToken);
        await this.authService.linkGitHubToUser(payload.sub, {
          id: req.user.id,
          login: req.user.login,
          avatar_url: req.user.avatar_url,
        });
        res.cookie('gh_token', req.user.accessToken, {
          ...COOKIE_OPTIONS,
          maxAge: 60 * 60 * 1000,
        });
        return res.redirect(`${frontendUrl}/profile?linked=github`);
      } catch {
        // Token invalid or linking failed — fall through to normal login
      }
    }

    const tokens = await this.authService.handleGitHubCallback({
      id: req.user.id,
      login: req.user.login,
      avatar_url: req.user.avatar_url,
      bio: req.user.bio,
    });

    res.cookie('access_token', tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie('gh_token', req.user.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 1000,
    });

    return res.redirect(`${frontendUrl}/auth/success`);
  }

  // ── GitHub Linking (authenticated) ───────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('link/github')
  async unlinkGitHub(@CurrentUser('id') userId: string) {
    await this.authService.unlinkGitHub(userId);
    return { success: true };
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
