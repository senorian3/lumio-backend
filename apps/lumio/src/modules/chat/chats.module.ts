import { Module } from '@nestjs/common';
import { LoggerModule } from '@libs/logger/logger.module';
import { UserAccountsModule } from '@lumio/modules/user-accounts/user-accounts.module';
import { ChatsController } from '@chat/modules/chats/api/chats.controller';

const useCases = [];

const adapters = [];

const repositories = [];

const queryRepositories = [];

@Module({
  imports: [UserAccountsModule, LoggerModule],
  controllers: [ChatsController],
  providers: [...useCases, ...adapters, ...repositories, ...queryRepositories],
  exports: [],
})
export class ChatsModule {}
