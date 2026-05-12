import { Module } from '@nestjs/common';
import { TestingController } from './testing.controller';

@Module({
  imports: [],
  controllers: [TestingController],
  providers: [],
})
export class TestingModule {}
