import { Module } from '@nestjs/common';
import { TestingController } from './testing.controller';
import { CoreConfig } from '@lumio/core/core.config';

@Module({
  imports: [],
  controllers: [TestingController],
  providers: [CoreConfig],
})
export class TestingModule {}
