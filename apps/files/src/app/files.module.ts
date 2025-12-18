import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesController } from '../api/files.controller';
import { FilesService } from '@files/application/s3.service';
import { UploadFilesCreatedPostUseCase } from '@files/application/use-cases/upload-post-file.usecase';
import { FileRepository } from '@files/domain/infrastructure/file.repository';
import { PrismaModule } from '@files/prisma/prisma.module';
import { CoreModule } from '@files/core/core.module';
import { CoreConfig } from '@files/core/core.config';
import { GetAllFilesByPostUserQueryHandler } from '@files/application/queries/get-all-file-by-post.query-handler';
import { QueryFileRepository } from '@files/domain/infrastructure/file.query.repository';

const services = [FilesService];

const useCases = [UploadFilesCreatedPostUseCase];

const queryHandler = [GetAllFilesByPostUserQueryHandler];

const repository = [FileRepository];

const queryFileRepository = [QueryFileRepository];

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
  providers: [
    ...services,
    ...useCases,
    ...queryHandler,
    ...repository,
    ...queryFileRepository,
  ],
})
export class FilesModule {}
