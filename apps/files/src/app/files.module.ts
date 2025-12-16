import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesController } from './files.controller';
import { FilesService } from '@files/application/s3.service';
import { UploadFilesCreatedPostUseCase } from '@files/application/use-cases/upload-post-file.usecase';
import { CqrsModule } from '@nestjs/cqrs';
import { FileRepository } from '@files/domain/infrastructure/file.repository';
import { PrismaService } from '@files/prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CqrsModule,
  ],

  controllers: [FilesController],
  providers: [
    FilesService,
    UploadFilesCreatedPostUseCase,
    FileRepository,
    PrismaService,
  ],
})
export class FilesModule {}
