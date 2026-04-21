import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StepUpService } from '../auth/step-up.service';

import { AgentsService, CreateAgentDto, UpdateAgentDto } from './agents.service';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly stepUp: StepUpService,
  ) {}

  /**
   * Create a new agent
   * POST /agents
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAgent(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateAgentDto & { twoFactorCode?: string },
  ) {
    await this.stepUp.assert(user.sub, dto.twoFactorCode);
    const { twoFactorCode: _drop, ...payload } = dto;
    const agent = await this.agentsService.createAgent(user.sub, payload);
    return {
      success: true,
      agent,
    };
  }

  /**
   * Get all agents for the current user
   * GET /agents
   */
  @Get()
  async listAgents(@CurrentUser() user: { sub: string }) {
    const agents = await this.agentsService.getAgentsByUserId(user.sub);
    return {
      success: true,
      agents,
      count: agents.length,
    };
  }

  /**
   * Get a specific agent
   * GET /agents/:id
   */
  @Get(':id')
  async getAgent(@Param('id') agentId: string, @CurrentUser() user: { sub: string }) {
    const agent = await this.agentsService.getAgent(agentId, user.sub);
    return {
      success: true,
      agent,
    };
  }

  /**
   * Update an agent
   * PATCH /agents/:id
   */
  @Patch(':id')
  async updateAgent(
    @Param('id') agentId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateAgentDto,
  ) {
    const agent = await this.agentsService.updateAgent(agentId, user.sub, dto);
    return {
      success: true,
      agent,
    };
  }

  /**
   * Delete an agent
   * DELETE /agents/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAgent(
    @Param('id') agentId: string,
    @CurrentUser() user: { sub: string },
    @Body() body: { twoFactorCode?: string } = {},
  ) {
    await this.stepUp.assert(user.sub, body.twoFactorCode);
    await this.agentsService.deleteAgent(agentId, user.sub);
  }

  /**
   * Test webhook
   * POST /agents/:id/test
   */
  @Post(':id/test')
  async testWebhook(@Param('id') agentId: string, @CurrentUser() user: { sub: string }) {
    const result = await this.agentsService.testWebhook(agentId, user.sub);
    return result;
  }

  /**
   * Get agent metrics
   * GET /agents/:id/metrics
   */
  @Get(':id/metrics')
  async getMetrics(@Param('id') agentId: string, @CurrentUser() user: { sub: string }) {
    const metrics = await this.agentsService.getMetrics(agentId, user.sub);
    return {
      success: true,
      metrics,
    };
  }

  /**
   * Get agent activity log
   * GET /agents/:id/activity-log
   */
  @Get(':id/activity-log')
  async getActivityLog(
    @Param('id') agentId: string,
    @CurrentUser() user: { sub: string },
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    const result = await this.agentsService.getActivityLog(agentId, user.sub, limitNum, offsetNum);
    return {
      success: true,
      ...result,
    };
  }
}
