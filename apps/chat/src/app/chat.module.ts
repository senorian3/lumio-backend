import { Module } from '@nestjs/common';
import { CoreModule } from '@chat/core/core.module';
import { PrismaModule } from '@chat/prisma/prisma.module';
import { TestingModule } from '@chat/modules/tests/testing.module';
import { ChatsModule } from '@chat/modules/chats/chats.module';

@Module({
  imports: [CoreModule, PrismaModule, TestingModule, ChatsModule],
})
export class ChatModule {}
