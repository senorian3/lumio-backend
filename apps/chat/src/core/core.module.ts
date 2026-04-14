import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreConfig } from './core.config';

@Module({
  imports: [ConfigModule],
  providers: [CoreConfig],
  exports: [CoreConfig],
})
export class CoreModule {}
