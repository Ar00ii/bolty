import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface UpdateProfileData {
  username?: string;
  displayName?: string;
  bio?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        githubLogin: true,
        walletAddress: true,
        role: true,
        profileSetup: true,
        twitterUrl: true,
        linkedinUrl: true,
        websiteUrl: true,
        userTag: true,
        email: true,
        twoFactorEnabled: true,
        createdAt: true,
        reputationPoints: true,
        _count: {
          select: { repositories: true, votes: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Search users by username (partial) or userTag exact (pass "#1234") */
  async search(query: string) {
    const q = query.trim().slice(0, 50);
    if (!q) return [];

    // "#1234" → exact tag match
    if (q.startsWith('#')) {
      const tag = q.slice(1);
      return this.prisma.user.findMany({
        where: { userTag: tag },
        select: { id: true, username: true, displayName: true, avatarUrl: true, userTag: true, reputationPoints: true },
        take: 10,
      });
    }

    // Otherwise search by username contains (strip leading @)
    const term = q.replace(/^@/, '');
    return this.prisma.user.findMany({
      where: { username: { contains: term, mode: 'insensitive' } },
      select: { id: true, username: true, displayName: true, avatarUrl: true, userTag: true, reputationPoints: true },
      take: 10,
      orderBy: { username: 'asc' },
    });
  }

  async updateProfile(userId: string, data: UpdateProfileData) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.username !== undefined && { username: data.username }),
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.twitterUrl !== undefined && { twitterUrl: data.twitterUrl || null }),
        ...(data.linkedinUrl !== undefined && { linkedinUrl: data.linkedinUrl || null }),
        ...(data.websiteUrl !== undefined && { websiteUrl: data.websiteUrl || null }),
        profileSetup: true,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        twitterUrl: true,
        linkedinUrl: true,
        websiteUrl: true,
        profileSetup: true,
      },
    });
    return updated;
  }

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        githubLogin: true,
        walletAddress: true,
        twitterUrl: true,
        linkedinUrl: true,
        websiteUrl: true,
        role: true,
        occupation: true,
        reputationPoints: true,
        createdAt: true,
        repositories: {
          where: { isLocked: false },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            name: true,
            fullName: true,
            description: true,
            language: true,
            stars: true,
            forks: true,
            githubUrl: true,
            topics: true,
            downloadCount: true,
            isLocked: true,
            lockedPriceUsd: true,
          },
        },
        _count: {
          select: { repositories: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
