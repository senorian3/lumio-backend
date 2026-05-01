import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '@chat/prisma/prisma.module';
import { ChatCoreModule } from '@chat/core/core.module';
import { CoreConfig } from '@chat/core/core.config';
import { LoggerModule } from '@libs/logger/logger.module';
import { ChatsController } from '@chat/modules/chats/api/chats.controller';
import { ChatsGatewayModule } from '@chat/modules/chats/application/chats-gateway.module';
import { MarkMessageReadCommandHandler } from '@chat/modules/chats/application/commands/mark-message-read.command-handler';
import { SendMessageCommandHandler } from '@chat/modules/chats/application/commands/send-message.command-handler';
import { SendMediaMessageCommandHandler } from '@chat/modules/chats/application/commands/send-media-message.command-handler';
import { GetChatMessagesQueryHandler } from '@chat/modules/chats/application/queries/get-chat-messages.query-handler';
import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';
import { TestingModule } from '@chat/modules/tests/testing.module';
import { ChatQueryRepository } from '@chat/modules/chats/domain/infrastructure/chat-query.repository';
import { FilesHttpAdapter } from '@chat/core/adapters/files-http.adapter';
import { HttpModule } from '@nestjs/axios';

const commandHandlers = [
  MarkMessageReadCommandHandler,
  SendMessageCommandHandler,
  SendMediaMessageCommandHandler,
];
const queryHandlers = [GetChatMessagesQueryHandler];
const adapters = [FilesHttpAdapter];
const repositories = [ChatRepository];
const queryRepositories = [ChatQueryRepository];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CqrsModule,
    HttpModule,
    ChatCoreModule,
    LoggerModule,
    PrismaModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => ({ url: coreConfig.dbUrl }),
      inject: [CoreConfig],
    }),
    ChatsGatewayModule,
  ],

  controllers: [ChatsController],
  providers: [
    ...adapters,
    ...commandHandlers,
    ...queryHandlers,
    ...repositories,
    ...queryRepositories,
  ],
})
export class ChatModule {
  static forRoot(coreConfig: CoreConfig): DynamicModule {
    return {
      module: ChatModule,
      providers: [
        {
          provide: CoreConfig,
          useValue: coreConfig,
        },
      ],
      imports: coreConfig.includeTestingModule ? [TestingModule] : [],
    };
  }
}
