import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import { messagingConfig } from './messaging.config';

@Module({
  imports: [ConfigModule.forFeature(messagingConfig)],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
