import { Module } from '@nestjs/common';
import { TestingController } from './testing.controller';
import { S3FilesHttpAdapter } from '@files/core/adapters/s3-files-http.adapter';

@Module({
  imports: [],
  controllers: [TestingController],
  providers: [S3FilesHttpAdapter],
})
export class TestingModule {}
