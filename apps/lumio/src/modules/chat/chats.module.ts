import { Module } from '@nestjs/common';
import { LoggerModule } from '@libs/logger/logger.module';
import { UserAccountsModule } from '@lumio/modules/user-accounts/user-accounts.module';
import { ChatsController } from '@lumio/modules/chat/api/chats.controller';
import { ChatHttpAdapter } from '@lumio/modules/chat/application/chat-http.adapter';
import { SendMessageCommandHandler } from '@lumio/modules/chat/application/commands/send-message.command-handler';
import { GetChatMessagesQueryHandler } from '@lumio/modules/chat/application/queries/get-chat-messages.query-handler';
import { MarkMessageReadCommandHandler } from '@lumio/modules/chat/application/commands/mark-message-read.command-handler';

const useCases = [
  SendMessageCommandHandler,
  GetChatMessagesQueryHandler,
  MarkMessageReadCommandHandler,
];

const adapters = [];

const repositories = [];

const queryRepositories = [];

@Module({
  imports: [UserAccountsModule, LoggerModule],
  controllers: [ChatsController],
  providers: [
    ...useCases,
    ...adapters,
    ...repositories,
    ...queryRepositories,
    ChatHttpAdapter,
  ],
  exports: [],
})
export class ChatsModule {}
