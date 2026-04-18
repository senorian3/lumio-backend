import { ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { CoreConfig } from './core.config';
import { CqrsModule } from '@nestjs/cqrs';

@Global()
@Module({
  imports: [CqrsModule],
  providers: [CoreConfig, ConfigService],
  exports: [CoreConfig, CqrsModule],
})
export class ChatCoreModule {}
