import * as crypto from 'crypto';

import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * CSRF Guard — Double-submit cookie pattern
 *
 * How it works:
 * 1. Server generates a CSRF token and sends it as a non-httpOnly cookie
 * 2. Client (JS) reads the cookie value
 * 3. On mutation (POST/PUT/PATCH/DELETE), client sends token as X-CSRF-Token header
 * 4. Server validates: header token === cookie token
 * 5. If they match, the request is from the same origin (CSRF protection)
 *
 * Why this works:
 * - A cross-site attacker can see the cookie (non-httpOnly) but cannot read it (httpOnly on origin would block)
 * - The attacker cannot set the header from their own domain (SameSite + CORS restrictions)
 * - The client can only set custom headers if they're in the CORS allowlist
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const method = request.method.toUpperCase();

    // GET, HEAD, OPTIONS requests don't need CSRF validation (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      // Emit a fresh CSRF token for subsequent mutations
      this.emitCsrfToken(response);
      return true;
    }

    // For mutations (POST, PUT, PATCH, DELETE), validate CSRF token
    const headerToken = request.get('X-CSRF-Token');
    const cookieToken = request.cookies['X-CSRF-Token'];

    if (!headerToken || !cookieToken) {
      throw new ForbiddenException('Missing CSRF token (header or cookie)');
    }

    // Constant-time comparison to prevent timing attacks
    if (!this.timingSafeEqual(headerToken, cookieToken)) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    return true;
  }

  /**
   * Emit a new CSRF token to the client via non-httpOnly cookie
   * The client reads this cookie and sends it back as a header
   */
  private emitCsrfToken(response: Response): void {
    const token = crypto.randomBytes(32).toString('hex');
    response.cookie('X-CSRF-Token', token, {
      httpOnly: false, // JavaScript can read this (intentional for CSRF pattern)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Prevent cross-site cookie sending
      maxAge: 3600000, // 1 hour
      path: '/',
    });
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}
