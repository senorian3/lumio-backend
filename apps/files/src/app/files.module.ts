import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@files/prisma/prisma.module';
import { CoreModule } from '@files/core/core.module';
import { CoreConfig } from '@files/core/core.config';
import { LoggerModule } from '@libs/logger/logger.module';
import { PostFilesController } from '@files/modules/post-files/api/post-files.controller';
import { GetAllFilesByPostUserQueryHandler } from '@files/modules/post-files/application/queries/get-all-files-by-post.query-handler';
import { DeletedPostFileCommandHandler } from '@files/modules/post-files/application/commands/deleted-post-file.command-handler';
import { UploadFilesCreatedPostCommandHandler } from '@files/modules/post-files/application/commands/upload-post-file.command-handler';
import { QueryFileRepository } from '@files/modules/post-files/domain/infrastructure/file.query.repository';
import { FileRepository } from '@files/modules/post-files/domain/infrastructure/file.repository';
import { ProfileRepository } from '@files/modules/avatar/domain/infrastructure/profile.repository';
import { UploadUserAvatarCommandHandler } from '@files/modules/avatar/application/commands/upload-user-avatar.command-handler';
import { AvatarController } from '@files/modules/avatar/api/avatar.controller';
import { S3FilesHttpAdapter } from '@files/core/services/s3-files-http.adapter';

const adapters = [S3FilesHttpAdapter];

const useCases = [
  UploadFilesCreatedPostCommandHandler,
  DeletedPostFileCommandHandler,
  UploadUserAvatarCommandHandler,
];

const queryHandler = [GetAllFilesByPostUserQueryHandler];

const repository = [FileRepository, ProfileRepository];

const queryRepository = [QueryFileRepository];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CoreModule,
    LoggerModule,
    PrismaModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => ({ url: coreConfig.dbUrl }),
      inject: [CoreConfig],
    }),
  ],

  controllers: [PostFilesController, AvatarController],
  providers: [
    ...adapters,
    ...useCases,
    ...queryHandler,
    ...repository,
    ...queryRepository,
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
