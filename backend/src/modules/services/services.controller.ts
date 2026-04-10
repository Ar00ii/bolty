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
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { ServicesService, CreateServiceDto } from './services.service';

@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Public()
  @Get()
  listServices(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('userId') userId?: string,
  ) {
    return this.servicesService.listServices({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      category,
      search,
      userId,
    });
  }

  @Public()
  @Get(':id')
  getService(@Param('id') id: string) {
    return this.servicesService.getService(id);
  }

  @Post()
  createService(@CurrentUser('id') userId: string, @Body() dto: CreateServiceDto) {
    return this.servicesService.createService(userId, dto);
  }

  @Patch(':id')
  updateService(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateServiceDto>,
  ) {
    return this.servicesService.updateService(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteService(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.servicesService.deleteService(userId, id);
  }

  @Patch(':id/toggle')
  toggleStatus(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.servicesService.toggleStatus(userId, id);
  }
}
