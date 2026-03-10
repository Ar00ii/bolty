import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ConflictException,
} from '@nestjs/common';
import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
  IsUrl,
} from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UsersService } from './users.service';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain letters, numbers, _ and -' })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  bio?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid Twitter URL' })
  @MaxLength(200)
  twitterUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid LinkedIn URL' })
  @MaxLength(200)
  linkedinUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid website URL' })
  @MaxLength(200)
  websiteUrl?: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    try {
      return await this.usersService.updateProfile(userId, dto);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Unique constraint') || msg.includes('username')) {
        throw new ConflictException('Username already taken');
      }
      throw err;
    }
  }

  @Public()
  @Get(':username')
  getUserProfile(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }
}
