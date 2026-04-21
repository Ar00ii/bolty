import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { AgentStatus, ActivityStatus, Prisma } from '@prisma/client';
import axios from 'axios';

import { PrismaService } from '../../common/prisma/prisma.service';
import { isSafeUrl, isSafeUrlResolving } from '../../common/sanitize/sanitize.util';

export interface CreateAgentDto {
  name: string;
  description?: string;
  webhookUrl: string;
  status?: AgentStatus;
}

export interface UpdateAgentDto {
  name?: string;
  description?: string;
  webhookUrl?: string;
  status?: AgentStatus;
}

export interface TestWebhookPayload {
  event: string;
  timestamp: number;
  test: true;
  data?: Record<string, unknown>;
}

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);
  private readonly WEBHOOK_TIMEOUT = 10000; // 10 seconds

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new agent for a user
   */
  async createAgent(userId: string, dto: CreateAgentDto) {
    try {
      // Validate webhook URL
      if (!this.isValidWebhookUrl(dto.webhookUrl)) {
        throw new BadRequestException('Invalid webhook URL');
      }

      const agent = await this.prisma.agent.create({
        data: {
          name: dto.name,
          description: dto.description,
          webhookUrl: dto.webhookUrl,
          status: dto.status || AgentStatus.INACTIVE,
          userId,
          metrics: {
            create: {
              totalCalls: 0,
              successfulCalls: 0,
              failedCalls: 0,
              avgResponseTime: 0,
            },
          },
        },
        include: {
          metrics: true,
        },
      });

      return agent;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create agent: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get all agents for a user
   */
  async getAgentsByUserId(userId: string) {
    return this.prisma.agent.findMany({
      where: { userId },
      include: {
        metrics: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a specific agent with validation
   */
  async getAgent(agentId: string, userId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        metrics: true,
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Verify ownership
    if (agent.userId !== userId) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  /**
   * Update an agent
   */
  async updateAgent(agentId: string, userId: string, dto: UpdateAgentDto) {
    const agent = await this.getAgent(agentId, userId);

    // Validate webhook URL if provided
    if (dto.webhookUrl && !this.isValidWebhookUrl(dto.webhookUrl)) {
      throw new BadRequestException('Invalid webhook URL');
    }

    return this.prisma.agent.update({
      where: { id: agentId },
      data: {
        name: dto.name ?? agent.name,
        description: dto.description ?? agent.description,
        webhookUrl: dto.webhookUrl ?? agent.webhookUrl,
        status: dto.status ?? agent.status,
      },
      include: {
        metrics: true,
      },
    });
  }

  /**
   * Delete an agent
   */
  async deleteAgent(agentId: string, userId: string) {
    await this.getAgent(agentId, userId); // Verify ownership

    await this.prisma.agent.delete({
      where: { id: agentId },
    });
  }

  /**
   * Test webhook by sending a test payload
   */
  async testWebhook(
    agentId: string,
    userId: string,
  ): Promise<{
    success: boolean;
    responseTime: number;
    statusCode?: number;
    error?: string;
  }> {
    const agent = await this.getAgent(agentId, userId);

    const payload: TestWebhookPayload = {
      event: 'test',
      timestamp: Date.now(),
      test: true,
    };

    const startTime = Date.now();

    // Resolve DNS and block if any returned address is private — otherwise
    // a user could register webhookUrl=http://attacker.com and rebind it
    // to 127.0.0.1 between the URL-validation step and this request.
    const check = await isSafeUrlResolving(agent.webhookUrl);
    if (!check.ok) {
      await this.logActivity(agentId, 'webhook_test', 'FAILED', {
        responseTime: 0,
        error: `Blocked: ${check.reason}`,
      });
      return {
        success: false,
        responseTime: 0,
        error: `Webhook URL blocked (${check.reason})`,
      };
    }

    try {
      const response = await axios.post(agent.webhookUrl, payload, {
        timeout: this.WEBHOOK_TIMEOUT,
        validateStatus: () => true, // Accept all status codes
        maxRedirects: 0, // a 302 could punt us to an internal host
        // Pin the resolved IP so a second lookup can't be rebound.
        lookup: (_hostname, _options, cb) => {
          cb(null, check.ip, check.family);
        },
      });

      const responseTime = Date.now() - startTime;

      // Log the webhook test
      await this.logActivity(agentId, 'webhook_test', 'SUCCESS', {
        responseTime,
        statusCode: response.status,
      });

      return {
        success: response.status >= 200 && response.status < 300,
        responseTime,
        statusCode: response.status,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log the failed webhook test
      await this.logActivity(agentId, 'webhook_test', 'FAILED', {
        responseTime,
        error: errorMessage,
      });

      return {
        success: false,
        responseTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Get agent metrics
   */
  async getMetrics(agentId: string, userId: string) {
    const agent = await this.getAgent(agentId, userId);
    return agent.metrics;
  }

  /**
   * Get agent activity log
   */
  async getActivityLog(agentId: string, userId: string, limit = 50, offset = 0) {
    // Verify agent belongs to user
    await this.getAgent(agentId, userId);

    const [activities, total] = await Promise.all([
      this.prisma.agentActivityLog.findMany({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.agentActivityLog.count({ where: { agentId } }),
    ]);

    return {
      items: activities,
      total,
      limit,
      offset,
    };
  }

  /**
   * Log an activity for an agent
   */
  async logActivity(
    agentId: string,
    action: string,
    status: ActivityStatus,
    metadata?: Record<string, unknown>,
  ) {
    try {
      const rt = typeof metadata?.responseTime === 'number' ? metadata.responseTime : null;
      await this.prisma.agentActivityLog.create({
        data: {
          agentId,
          action,
          status,
          metadata: (metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          responseTime: rt,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to log activity: ${errorMessage}`);
      // Don't throw, just log error
    }
  }

  /**
   * Update agent metrics
   */
  async updateMetrics(agentId: string, success: boolean, responseTime?: number) {
    try {
      const metrics = await this.prisma.agentMetrics.findUnique({
        where: { agentId },
      });

      if (!metrics) {
        return; // Silently fail if metrics don't exist
      }

      const newTotalCalls = metrics.totalCalls + 1;
      const newSuccessfulCalls = success ? metrics.successfulCalls + 1 : metrics.successfulCalls;
      const newFailedCalls = !success ? metrics.failedCalls + 1 : metrics.failedCalls;

      // Calculate new average response time
      let newAvgResponseTime = metrics.avgResponseTime;
      if (responseTime !== undefined) {
        newAvgResponseTime = Math.round(
          (metrics.avgResponseTime * metrics.totalCalls + responseTime) / newTotalCalls,
        );
      }

      await this.prisma.agentMetrics.update({
        where: { agentId },
        data: {
          totalCalls: newTotalCalls,
          successfulCalls: newSuccessfulCalls,
          failedCalls: newFailedCalls,
          avgResponseTime: newAvgResponseTime,
          lastCallAt: new Date(),
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update metrics: ${errorMessage}`);
      // Don't throw, just log error
    }
  }

  /**
   * Validate webhook URL format + SSRF guards
   */
  private isValidWebhookUrl(url: string): boolean {
    if (!isSafeUrl(url)) return false;
    try {
      const parsed = new URL(url);
      // Must be HTTPS in production
      if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}
