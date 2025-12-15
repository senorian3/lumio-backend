import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesController } from './files.controller';
// import { FilesService } from './files.service';
// import { S3Service } from './s3.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [FilesController],
  // providers: [FilesService, S3Service],
})
export class FilesModule {}
