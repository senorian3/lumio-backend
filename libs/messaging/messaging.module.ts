import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import { MessagingConfig } from './messaging-config.class';

@Module({
  imports: [ConfigModule],
  providers: [MessagingService, MessagingConfig],
  exports: [MessagingService, MessagingConfig],
})
export class MessagingModule {}
