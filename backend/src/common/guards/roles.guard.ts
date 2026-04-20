import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedRequest {
  user?: { id?: string; role?: UserRole };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;
    if (!userId) throw new ForbiddenException('Not authenticated');

    // Always fetch fresh role from DB — JWT payload may be stale after a promotion/demotion.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isBanned: true },
    });

    if (!user || user.isBanned) throw new ForbiddenException('Access denied');
    if (!required.includes(user.role)) {
      throw new ForbiddenException(`Role ${required.join(' or ')} required`);
    }

    // Keep the request.user.role in sync so downstream code sees the fresh value.
    if (request.user) request.user.role = user.role;
    return true;
  }
}
