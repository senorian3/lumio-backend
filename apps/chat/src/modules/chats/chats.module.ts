import { Module } from '@nestjs/common';
import { ChatsController } from './api/chats.controller';

@Module({
  controllers: [ChatsController],
  providers: [],
  exports: [],
})
export class ChatsModule {}
