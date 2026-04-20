import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ServiceCategory } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';
import { sanitizeText } from '../../common/sanitize/sanitize.util';

export interface CreateServiceDto {
  title: string;
  description: string;
  category: string;
  skills: string[];
  minBudget?: number;
  maxBudget?: number;
  currency?: string;
  deliveryDays?: number;
  imageUrl?: string;
}

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async createService(userId: string, dto: CreateServiceDto) {
    const validCategories = [
      'AI_DEVELOPMENT',
      'SMART_CONTRACTS',
      'WEB_DEVELOPMENT',
      'BOT_DEVELOPMENT',
      'CONSULTING',
      'CODE_REVIEW',
      'MOBILE_DEVELOPMENT',
      'DEVOPS',
      'OTHER',
    ];

    if (!validCategories.includes(dto.category)) {
      throw new BadRequestException('Invalid service category');
    }

    if (!dto.title || dto.title.trim().length < 5) {
      throw new BadRequestException('Title must be at least 5 characters');
    }
    if (!dto.description || dto.description.trim().length < 20) {
      throw new BadRequestException('Description must be at least 20 characters');
    }
    if (dto.skills && dto.skills.length > 15) {
      throw new BadRequestException('Maximum 15 skills allowed');
    }

    return this.prisma.serviceListing.create({
      data: {
        title: sanitizeText(dto.title.slice(0, 120)),
        description: sanitizeText(dto.description.slice(0, 3000)),
        category: dto.category as ServiceCategory,
        skills: (dto.skills || []).map((s) => sanitizeText(s.slice(0, 50))).slice(0, 15),
        minBudget: dto.minBudget || null,
        maxBudget: dto.maxBudget || null,
        currency: dto.currency || 'USD',
        deliveryDays: dto.deliveryDays || null,
        imageUrl: dto.imageUrl?.slice(0, 500) || null,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            reputationPoints: true,
            occupation: true,
          },
        },
      },
    });
  }

  async listServices(params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    userId?: string;
  }) {
    const { page = 1, limit = 20, category, search, userId } = params;
    const skip = (page - 1) * Math.min(limit, 50);
    const take = Math.min(limit, 50);

    const where: Record<string, unknown> = {
      status: 'ACTIVE',
      ...(category ? { category } : {}),
      ...(userId ? { userId } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { skills: { has: search } },
            ],
          }
        : {}),
    };

    const [services, total] = await Promise.all([
      this.prisma.serviceListing.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              reputationPoints: true,
              occupation: true,
            },
          },
        },
      }),
      this.prisma.serviceListing.count({ where }),
    ]);

    return {
      data: services,
      meta: { total, page, limit: take, pages: Math.ceil(total / take) },
    };
  }

  async getService(id: string) {
    const service = await this.prisma.serviceListing.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            reputationPoints: true,
            occupation: true,
            bio: true,
            twitterUrl: true,
            websiteUrl: true,
            _count: {
              select: { repositories: true, marketListings: true, serviceListings: true },
            },
          },
        },
      },
    });

    if (!service) throw new NotFoundException('Service listing not found');
    return service;
  }

  async updateService(userId: string, id: string, dto: Partial<CreateServiceDto>) {
    const service = await this.prisma.serviceListing.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service listing not found');
    if (service.userId !== userId) throw new ForbiddenException('Not authorized');

    const updates: Record<string, unknown> = {};
    if (dto.title) updates.title = sanitizeText(dto.title.slice(0, 120));
    if (dto.description) updates.description = sanitizeText(dto.description.slice(0, 3000));
    if (dto.category) updates.category = dto.category;
    if (dto.skills)
      updates.skills = dto.skills.map((s) => sanitizeText(s.slice(0, 50))).slice(0, 15);
    if (dto.minBudget !== undefined) updates.minBudget = dto.minBudget;
    if (dto.maxBudget !== undefined) updates.maxBudget = dto.maxBudget;
    if (dto.deliveryDays !== undefined) updates.deliveryDays = dto.deliveryDays;
    if (dto.imageUrl !== undefined) updates.imageUrl = dto.imageUrl?.slice(0, 500) || null;

    return this.prisma.serviceListing.update({
      where: { id },
      data: updates as Record<string, unknown>,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            reputationPoints: true,
          },
        },
      },
    });
  }

  async deleteService(userId: string, id: string) {
    const service = await this.prisma.serviceListing.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service listing not found');
    if (service.userId !== userId) throw new ForbiddenException('Not authorized');
    await this.prisma.serviceListing.delete({ where: { id } });
    return { success: true };
  }

  async toggleStatus(userId: string, id: string) {
    const service = await this.prisma.serviceListing.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service listing not found');
    if (service.userId !== userId) throw new ForbiddenException('Not authorized');

    const newStatus = service.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    return this.prisma.serviceListing.update({
      where: { id },
      data: { status: newStatus as 'ACTIVE' | 'PAUSED' },
      select: { id: true, status: true },
    });
  }
}
