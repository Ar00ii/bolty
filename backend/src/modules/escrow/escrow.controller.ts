import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

import { EscrowService } from './escrow.service';

class ReleaseDto {
  @IsString()
  @MaxLength(80)
  txHash!: string;
}

class DisputeDto {
  @IsString()
  @MaxLength(80)
  txHash!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}

class ResolveDto {
  @IsBoolean()
  refundBuyer!: boolean;

  @IsString()
  @MaxLength(80)
  txHash!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

@Controller('escrow')
export class EscrowController {
  constructor(private readonly escrow: EscrowService) {}

  /** POST /escrow/orders/:orderId/release — buyer confirms they called release() */
  @Post('orders/:orderId/release')
  release(
    @Param('orderId') orderId: string,
    @Body() body: ReleaseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.escrow.confirmRelease(orderId, userId, body.txHash);
  }

  /** POST /escrow/orders/:orderId/dispute — buyer or seller opens a dispute */
  @Post('orders/:orderId/dispute')
  dispute(
    @Param('orderId') orderId: string,
    @Body() body: DisputeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.escrow.confirmDispute(orderId, userId, body.txHash, { reason: body.reason });
  }

  /** GET /escrow/disputes — admin-only list of disputed orders */
  @Get('disputes')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  listDisputes() {
    return this.escrow.listDisputes();
  }

  /** POST /escrow/orders/:orderId/resolve — admin resolves a disputed order */
  @Post('orders/:orderId/resolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  resolve(
    @Param('orderId') orderId: string,
    @Body() body: ResolveDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.escrow.resolveDispute({
      orderId,
      adminId,
      refundBuyer: body.refundBuyer,
      txHash: body.txHash,
      note: body.note,
    });
  }
}
