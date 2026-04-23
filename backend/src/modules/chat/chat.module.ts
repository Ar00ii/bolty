import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { AuthModule } from '../auth/auth.module';

import { ChatBotService } from './chat-bot.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthModule, MulterModule.register()],
  providers: [ChatGateway, ChatService, ChatBotService],
  controllers: [ChatController],
})
export class ChatModule {}
