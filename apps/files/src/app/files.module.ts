import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesController } from '../modules/api/files.controller';
import { FileRepository } from '@files/modules/domain/infrastructure/file.repository';
import { PrismaModule } from '@files/prisma/prisma.module';
import { CoreModule } from '@files/core/core.module';
import { CoreConfig } from '@files/core/core.config';
import { QueryFileRepository } from '@files/modules/domain/infrastructure/file.query.repository';
import { FilesService } from '@files/modules/application/s3.service';
import { DeletedPostFilePostUseCase } from '@files/modules/application/use-cases/deleted-post-file.usecase';
import { GetAllFilesByPostUserQueryHandler } from '@files/modules/application/queries/get-all-files-by-post.query-handler';
import { UploadFilesCreatedPostUseCase } from '@files/modules/application/use-cases/upload-post-file.usecase';

const services = [FilesService];

const useCases = [UploadFilesCreatedPostUseCase, DeletedPostFilePostUseCase];

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
export class FilesModule {
  static forRoot(coreConfig: CoreConfig): DynamicModule {
    return {
      module: FilesModule,
      providers: [
        {
          provide: CoreConfig,
          useValue: coreConfig,
        },
      ],
    };
  }
}
