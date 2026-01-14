import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@files/prisma/prisma.module';
import { CoreModule } from '@files/core/core.module';
import { CoreConfig } from '@files/core/core.config';
import { LoggerModule } from '@libs/logger/logger.module';
import { FilesController } from '@files/modules/posts/api/files.controller';
import { GetAllFilesByPostUserQueryHandler } from '@files/modules/posts/application/queries/get-all-files-by-post.query-handler';
import { FilesService } from '@files/core/services/s3.service';
import { DeletedPostFileCommandHandler } from '@files/modules/posts/application/commands/deleted-post-file.command-handler';
import { UploadFilesCreatedPostCommandHandler } from '@files/modules/posts/application/commands/upload-post-file.command-handler';
import { QueryFileRepository } from '@files/modules/posts/domain/infrastructure/file.query.repository';
import { FileRepository } from '@files/modules/posts/domain/infrastructure/file.repository';
import { ProfileRepository } from '@files/modules/profile/domain/infrastructure/profile.repository';
import { UploadUserAvatarCommandHandler } from '@files/modules/profile/application/commands/upload-user-avatar.command-handler';
import { ProfileController } from '@files/modules/profile/api/profile.controller';

const services = [FilesService];

const useCases = [
  UploadFilesCreatedPostCommandHandler,
  DeletedPostFileCommandHandler,
  UploadUserAvatarCommandHandler,
];

const queryHandler = [GetAllFilesByPostUserQueryHandler];

const repository = [FileRepository, ProfileRepository];

const queryFileRepository = [QueryFileRepository];

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

  controllers: [FilesController, ProfileController],
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
