import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ChatsGateway } from './chats.gateway';
import { WsJwtGuard } from '../../../core/guards/ws-jwt.guard';
import { ChatCoreModule } from '@chat/core/core.module';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '@chat/prisma/prisma.module';
import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';
import { LumioAuthHttpAdapter } from '@chat/core/adapters/lumio-auth-http.adapter';

@Module({
  imports: [CqrsModule, ChatCoreModule, HttpModule, PrismaModule],
  providers: [ChatsGateway, WsJwtGuard, ChatRepository, LumioAuthHttpAdapter],
  exports: [ChatsGateway],
})
export class ChatsGatewayModule {}
