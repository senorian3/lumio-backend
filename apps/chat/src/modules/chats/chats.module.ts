import { Module } from '@nestjs/common';
import { chatController } from './api/chats.controller';

@Module({
  controllers: [chatController],
  providers: [],
  exports: [],
})
export class ChatsModule {}
