import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesController } from './files.controller';
import { FilesService } from '@files/application/s3.service';
import { UploadFilesCreatedPostUseCase } from '@files/application/use-cases/upload-post-file.usecase';
import { FileRepository } from '@files/domain/infrastructure/file.repository';
import { PrismaModule } from '@files/prisma/prisma.module';
import { CoreModule } from '@files/core/core.module';
import { CoreConfig } from '@files/core/core.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CoreModule,
    PrismaModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => ({ url: coreConfig.dbUrl }),
      inject: [CoreConfig],
    }),
  ],

  controllers: [FilesController],
  providers: [FilesService, UploadFilesCreatedPostUseCase, FileRepository],
})
export class FilesModule {}
