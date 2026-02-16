import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@files/prisma/prisma.module';
import { FilesCoreModule } from '@files/core/core.module';
import { CoreConfig } from '@files/core/core.config';
import { LoggerModule } from '@libs/logger/logger.module';
import { PostFilesController } from '@files/modules/post-files/api/post-files.controller';
import { GetAllFilesByPostUserQueryHandler } from '@files/modules/post-files/application/queries/get-all-files-by-post.query-handler';
import { GetAllFilesByPostIdsQueryHandler } from '@files/modules/post-files/application/queries/get-all-files-by-post-ids.query-handler';
import { DeletedPostFilesCommandHandler } from '@files/modules/post-files/application/commands/deleted-post-files.command-handler';
import { UploadFilesCreatedPostCommandHandler } from '@files/modules/post-files/application/commands/upload-post-file.command-handler';
import { DeleteFileByKeyCommandHandler } from '@files/modules/post-files/application/commands/delete-file-by-key.command-handler';
import { QueryFileRepository } from '@files/modules/post-files/domain/infrastructure/file.query.repository';
import { FileRepository } from '@files/modules/post-files/domain/infrastructure/file.repository';
import { ProfileRepository } from '@files/modules/avatar/domain/infrastructure/profile.repository';
import { UploadUserAvatarCommandHandler } from '@files/modules/avatar/application/commands/upload-user-avatar.command-handler';
import { DeleteUserAvatarCommandHandler } from '@files/modules/avatar/application/commands/delete-user-avatar.command-handler';
import { AvatarController } from '@files/modules/avatar/api/avatar.controller';
import { S3FilesHttpAdapter } from '@files/core/adapters/s3-files-http.adapter';
import { TestingModule } from '@files/modules/tests/testing.module';

const commandHandlers = [
  UploadFilesCreatedPostCommandHandler,
  DeletedPostFilesCommandHandler,
  UploadUserAvatarCommandHandler,
  DeleteUserAvatarCommandHandler,
  DeleteFileByKeyCommandHandler,
];
const queryHandlers = [
  GetAllFilesByPostUserQueryHandler,
  GetAllFilesByPostIdsQueryHandler,
];
const adapters = [S3FilesHttpAdapter];
const repositories = [FileRepository, ProfileRepository];
const queryRepositories = [QueryFileRepository];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FilesCoreModule,
    LoggerModule,
    PrismaModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => ({ url: coreConfig.dbUrl }),
      inject: [CoreConfig],
    }),
  ],

  controllers: [PostFilesController, AvatarController],
  providers: [
    ...adapters,
    ...commandHandlers,
    ...queryHandlers,
    ...repositories,
    ...queryRepositories,
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
      imports: coreConfig.includeTestingModule ? [TestingModule] : [],
    };
  }
}
