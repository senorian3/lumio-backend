import { Module } from '@nestjs/common';
import { ChatsController } from './api/chats.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { SendMessageCommandHandler } from '@chat/modules/chats/application/commands/send-message.command-handler';
import { MarkMessageReadCommandHandler } from '@chat/modules/chats/application/commands/mark-message-read.command-handler';
import { GetChatMessagesQueryHandler } from '@chat/modules/chats/application/queries/get-chat-messages.query-handler';
import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';
import { PrismaModule } from '@chat/prisma/prisma.module';

const useCases = [
  SendMessageCommandHandler,
  MarkMessageReadCommandHandler,
  GetChatMessagesQueryHandler,
];

const adapters = [];

const repositories = [ChatRepository];

const queryRepositories = [];

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [ChatsController],
  providers: [...useCases, ...adapters, ...repositories, ...queryRepositories],
  exports: [],
})
export class ChatsModule {}
