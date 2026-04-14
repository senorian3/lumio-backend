import { Module } from '@nestjs/common';
import { ChatsController } from './api/chats.controller';
import { ChatsService } from './application/chats.service';

@Module({
  controllers: [ChatsController],
  providers: [ChatsService],
  exports: [ChatsService],
})
export class ChatsModule {}
