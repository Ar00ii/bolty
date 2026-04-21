import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { ChatBotService } from './chat-bot.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthModule],
  providers: [ChatGateway, ChatService, ChatBotService],
  controllers: [ChatController],
})
export class ChatModule {}
