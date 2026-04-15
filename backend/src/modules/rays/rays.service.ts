import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AgentRank, RaysPack, PurchaseStatus } from '@prisma/client';

interface RaysPackConfig {
  pack: RaysPack;
  rays: number;
  boltyPrice: number; // in BOLTY
}

@Injectable()
export class RaysService {
  private readonly logger = new Logger(RaysService.name);

  // Pack configurations
  private readonly PACKS: RaysPackConfig[] = [
    { pack: RaysPack.PACK_10, rays: 10, boltyPrice: 12 },
    { pack: RaysPack.PACK_25, rays: 25, boltyPrice: 28 },
    { pack: RaysPack.PACK_50, rays: 50, boltyPrice: 48 },
    { pack: RaysPack.PACK_120, rays: 120, boltyPrice: 110 },
    { pack: RaysPack.PACK_250, rays: 250, boltyPrice: 230 },
  ];

  // Rank configurations (rays needed for each rank)
  private readonly RANK_REQUIREMENTS: Record<AgentRank, number> = {
    HIERRO: 0,
    BRONCE: 25,
    PLATA: 50,
    ORO: 120,
    PLATINO: 250,
    DIAMANTE: 500,
    MAESTRIA: 1000,
    CAMPEON: 2000, // Only for top 5
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Get available packs
   */
  getPacks() {
    return this.PACKS;
  }

  /**
   * Get pack by type
   */
  getPackConfig(pack: RaysPack): RaysPackConfig {
    const config = this.PACKS.find((p) => p.pack === pack);
    if (!config) throw new BadRequestException('Invalid pack');
    return config;
  }

  /**
   * Purchase rays for an agent
   * In production, this would verify wallet signature or handle payment
   */
  async purchaseRays(userId: string, agentId: string, pack: RaysPack) {
    const packConfig = this.getPackConfig(pack);

    // Verify agent exists and belongs to user
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) throw new BadRequestException('Agent not found');
    if (agent.userId !== userId) throw new BadRequestException('Not authorized');

    // Create purchase record
    const purchase = await this.prisma.raysPurchase.create({
      data: {
        userId,
        agentId,
        raysPack: pack,
        raysAmount: packConfig.rays,
        boltyAmount: packConfig.boltyPrice.toString(),
        status: PurchaseStatus.COMPLETED,
      },
    });

    // Update agent rays
    await this.addRaysToAgent(agentId, packConfig.rays);

    return purchase;
  }

  /**
   * Add rays to agent and update rank if needed
   */
  private async addRaysToAgent(agentId: string, rays: number) {
    // Get or create agent rays record
    let agentRays = await this.prisma.agentRays.findUnique({
      where: { agentId },
    });

    if (!agentRays) {
      agentRays = await this.prisma.agentRays.create({
        data: {
          agentId,
          totalRaysAccumulated: rays,
          currentRank: this.getRankForRays(rays),
        },
      });
    } else {
      const previousRank = agentRays.currentRank;
      const newTotal = agentRays.totalRaysAccumulated + rays;
      const newRank = this.getRankForRays(newTotal);

      // Update rays
      agentRays = await this.prisma.agentRays.update({
        where: { agentId },
        data: {
          totalRaysAccumulated: newTotal,
          currentRank: newRank,
          lastRankUpAt: newRank !== previousRank ? new Date() : undefined,
        },
      });

      // Record rank history if rank changed
      if (newRank !== previousRank) {
        await this.prisma.rankHistory.create({
          data: {
            agentRaysId: agentRays.id,
            previousRank,
            newRank,
            totalRaysAt: newTotal,
          },
        });

        this.logger.log(
          `Agent ${agentId} ranked up from ${previousRank} to ${newRank}`,
        );
      }
    }
  }

  /**
   * Calculate rank based on total rays
   */
  private getRankForRays(totalRays: number): AgentRank {
    const ranks = Object.entries(this.RANK_REQUIREMENTS)
      .sort((a, b) => b[1] - a[1]);

    for (const [rank, required] of ranks) {
      if (totalRays >= required) {
        return rank as AgentRank;
      }
    }

    return AgentRank.HIERRO;
  }

  /**
   * Get agent rays info
   */
  async getAgentRays(agentId: string) {
    let agentRays = await this.prisma.agentRays.findUnique({
      where: { agentId },
      include: {
        rankHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!agentRays) {
      // Create default if doesn't exist
      agentRays = await this.prisma.agentRays.create({
        data: {
          agentId,
          totalRaysAccumulated: 0,
          currentRank: AgentRank.HIERRO,
        },
        include: { rankHistory: true },
      });
    }

    return agentRays;
  }

  /**
   * Get rays leaderboard (by accumulated rays)
   */
  async getRaysLeaderboard(limit = 50) {
    const leaderboard = await this.prisma.agentRays.findMany({
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        totalRaysAccumulated: 'desc',
      },
      take: limit,
    });

    return leaderboard.map((item, index) => ({
      position: index + 1,
      agent: item.agent.name,
      agentId: item.agent.id,
      creator: item.agent.user?.username || 'Unknown',
      totalRays: item.totalRaysAccumulated,
      rank: item.currentRank,
    }));
  }

  /**
   * Get creadores leaderboard
   * Based on: average sales per agent, total sales, successful sales
   */
  async getCreatorsLeaderboard(limit = 50) {
    const creators = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        aiAgents: {
          select: {
            id: true,
            name: true,
            rays: {
              select: {
                totalRaysAccumulated: true,
              },
            },
          },
        },
      },
    });

    // Calculate metrics
    const creatorMetrics = creators
      .map((creator) => {
        const agents = creator.aiAgents;
        if (agents.length === 0) return null;

        const totalRays = agents.reduce(
          (sum, agent) => sum + (agent.rays?.totalRaysAccumulated || 0),
          0,
        );
        const avgRaysPerAgent = totalRays / agents.length;

        return {
          creator: creator.username || creator.displayName || 'Unknown',
          creatorId: creator.id,
          agentsCount: agents.length,
          totalRays,
          avgRaysPerAgent: Math.round(avgRaysPerAgent),
        };
      })
      .filter((item) => item !== null)
      .sort((a, b) => b.totalRays - a.totalRays)
      .slice(0, limit)
      .map((item, index) => ({
        position: index + 1,
        ...item,
      }));

    return creatorMetrics;
  }

  /**
   * Get ranking position for an agent
   */
  async getAgentRankingPosition(agentId: string): Promise<number> {
    const agent = await this.prisma.agentRays.findUnique({
      where: { agentId },
    });

    if (!agent) return -1;

    const position = await this.prisma.agentRays.count({
      where: {
        totalRaysAccumulated: {
          gt: agent.totalRaysAccumulated,
        },
      },
    });

    return position + 1;
  }

  /**
   * Get all agents sorted by rays (for trending)
   */
  async getTrendingAgents(limit = 100) {
    const trending = await this.prisma.agentRays.findMany({
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            status: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        totalRaysAccumulated: 'desc',
      },
      take: limit,
    });

    return trending.map((item, index) => ({
      position: index + 1,
      agentId: item.agent.id,
      agentName: item.agent.name,
      creator: item.agent.user?.username || 'Unknown',
      totalRays: item.totalRaysAccumulated,
      rank: item.currentRank,
      status: item.agent.status,
    }));
  }
}
