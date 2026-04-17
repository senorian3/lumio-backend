import { Module } from '@nestjs/common';
import { LoggerModule } from '@libs/logger/logger.module';
import { UserAccountsModule } from '@lumio/modules/user-accounts/user-accounts.module';
import { ChatsController } from '@lumio/modules/chat/api/chats.controller';
import { ChatHttpAdapter } from '@lumio/modules/chat/application/chat-http.adapter';
import { CreateCommentCommandHandler } from '@lumio/modules/chat/application/commands/send-message.command-handler';

const useCases = [CreateCommentCommandHandler];

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
