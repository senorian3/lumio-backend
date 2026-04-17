import { Module } from '@nestjs/common';
import { chatController } from './api/chats.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { SendMessageCommandHandler } from '@chat/modules/chats/application/commands/send-message.command-handler';
import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';
import { PrismaModule } from '@chat/prisma/prisma.module';

const useCases = [SendMessageCommandHandler];

const adapters = [];

const repositories = [ChatRepository];

const queryRepositories = [];

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [chatController],
  providers: [...useCases, ...adapters, ...repositories, ...queryRepositories],
  exports: [],
})
export class ChatsModule {}
