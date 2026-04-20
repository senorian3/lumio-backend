import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CqrsModule } from '@nestjs/cqrs';
import { ChatsGateway } from './chats.gateway';
import { WsJwtGuard } from '../../../core/guards/ws-jwt.guard';

@Module({
  imports: [CqrsModule],
  providers: [ChatsGateway, JwtService, WsJwtGuard],
  exports: [ChatsGateway],
})
export class ChatsGatewayModule {}
