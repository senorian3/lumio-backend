import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { PostEntity } from '../../domain/entities/post.entity';
import { OutputFileType } from '@libs/dto/output/file-output';
import { AppLoggerService } from '@libs/logger/logger.service';
import { GLOBAL_PREFIX } from '@libs/settings/global-prefix.setup';
import { ExternalQueryUserAccountsRepository } from './../../../user-accounts/users/domain/infrastructure/user.external-query.repository';
import { FilesHttpAdapter } from '../files-http.adapter';
import { PostFilesRepository } from '../../domain/infrastructure/post-files.repository';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@lumio/prisma/prisma.service';

export class CreatePostCommand {
  constructor(
    public readonly userId: number,
    public readonly description: string,
    public readonly files: Array<Express.Multer.File>,
  ) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostCommandHandler implements ICommandHandler<
  CreatePostCommand,
  { files: OutputFileType[]; postId: string }
> {
  constructor(
    private readonly externalQueryUserAccountsRepository: ExternalQueryUserAccountsRepository,
    private readonly postRepository: PostRepository,
    private readonly postFilesRepository: PostFilesRepository,
    private readonly filesHttpAdapter: FilesHttpAdapter,
    private readonly logger: AppLoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    command: CreatePostCommand,
  ): Promise<{ files: OutputFileType[]; postId: string }> {
    const user = await this.externalQueryUserAccountsRepository.findUserId(
      command.userId,
    );

    if (!user) {
      throw NotFoundDomainException.create('User does not exist', 'userId');
    }

    const postId = uuidv4();

    let mappedFile: OutputFileType[];
    try {
      mappedFile = await this.filesHttpAdapter.uploadFiles<OutputFileType[]>(
        `${GLOBAL_PREFIX}/files/upload-post-files`,
        postId,
        command.userId,
        command.files,
      );
    } catch (error) {
      throw error;
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const newPost: PostEntity = await this.postRepository.createPost(
          command.userId,
          postId,
          command.description,
          tx,
        );
        await this.postFilesRepository.createPostFiles(
          newPost.id,
          mappedFile,
          tx,
        );
      });
      return { files: mappedFile, postId };
    } catch (error) {
      try {
        await this.filesHttpAdapter.deletePostFiles(postId);
      } catch (cleanupError) {
        this.logger.error(
          `Critical error to delete files from S3 for postId=${postId}: ${cleanupError.message}, need to delete files: ${mappedFile.map(
            (file) => file.id,
          )}`,
          cleanupError?.stack,
          CreatePostCommandHandler.name,
        );
      }

      throw error;
    }
  }
}
