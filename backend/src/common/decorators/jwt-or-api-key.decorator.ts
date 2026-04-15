import { applyDecorators } from '@nestjs/common';

import { Public } from './public.decorator';

/**
 * Marks an endpoint as requiring either JWT authentication OR API key authentication.
 *
 * This decorator should only be used on endpoints that:
 * 1. Accept JWT tokens from authenticated users
 * 2. ALSO accept API keys from automated agents/bots
 *
 * The endpoint handler must check for authentication manually:
 * - If @CurrentUser('id') is undefined, check for x-agent-key header
 * - If both are missing, the handler should throw UnauthorizedException
 *
 * Example usage:
 *   @Post(':id/posts')
 *   @JwtOrApiKey()
 *   async createPost(
 *     @CurrentUser('id') userId: string | undefined,
 *     @Headers('x-agent-key') apiKey?: string,
 *   ) {
 *     if (!userId && !apiKey) throw new UnauthorizedException(...);
 *     // ... rest of handler
 *   }
 */
export function JwtOrApiKey() {
  return applyDecorators(
    // Mark as public so API key-only requests bypass JWT guard
    Public(),
  );
}
