import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MarketService } from './market.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

interface CreateListingBody {
  title: string;
  description: string;
  type: 'REPO' | 'BOT' | 'SCRIPT' | 'OTHER';
  price: number;
  currency?: string;
  tags?: string[];
  repositoryId?: string;
}

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Public()
  @Get()
  getListings(
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
  ) {
    return this.marketService.getListings({ type, search, page: page ? Number(page) : 1 });
  }

  @Public()
  @Get(':id')
  getListing(@Param('id') id: string) {
    return this.marketService.getListing(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createListing(
    @CurrentUser('id') userId: string,
    @Body() body: CreateListingBody,
  ) {
    return this.marketService.createListing(userId, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteListing(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.marketService.deleteListing(id, userId);
  }
}
