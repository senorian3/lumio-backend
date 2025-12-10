import { ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CoreConfig } from './core.config';

@Global()
@Module({
  imports: [CqrsModule],
  exports: [CoreConfig, CqrsModule],
  providers: [CoreConfig, ConfigService],
})
export class CoreModule {}
