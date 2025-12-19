import { Controller } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UploadFilesCreatedPostCommand } from '@files/application/use-cases/upload-post-file.usecase';
import { GetAllFilesByPostUserQuery } from '@files/application/queries/get-all-file-by-post.query-handler';
import { Ctx, MessagePattern, Payload } from '@nestjs/microservices/decorators';
import { RABBITMQ_CONFIG } from '@libs/rabbitmq/rabbitmq.constants';
import { OutputFilesDto } from '@libs/rabbitmq/dto/output';
import { RmqContext } from '@nestjs/microservices';
import { DeletedPostFileCommand } from '@files/application/use-cases/deleted-post-file.usecase';

@Controller('files')
export class FilesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}
  //@MessagePattern(RABBITMQ_CONFIG.messagePatterns.UPLOAD_FILES)
  // async uploadFiles() // @Payload() data: IUploadFilesRequest,
  // : Promise<IUploadedFile[]> {
  //   try {
  //     return;
  //     // await this.filesService.uploadFiles(data);
  //   } catch (error) {
  //     throw new RpcException(error.message);
  //   }
  // }
  // @MessagePattern(RABBITMQ_CONFIG.messagePatterns.DELETE_FILES)
  // async deleteFiles() // @Payload() data: IDeleteFilesRequest
  // : Promise<void> {
  //   try {
  //     return;
  //     // await this.filesService.deleteFiles(data);
  //   } catch (error) {
  //     throw new RpcException(error.message);
  //   }
  // }
  //
  // @MessagePattern(RABBITMQ_CONFIG.messagePatterns.GET_FILE_URLS)
  // async getFileUrls() // @Payload() data: { fileKeys: string[] },
  // : Promise<Array<{ key: string; url: string }>> {
  //   try {
  //     return;
  //     // await this.filesService.getFileUrls(data.fileKeys);
  //   } catch (error) {
  //     throw new RpcException(error.message);
  //   }
  // }
  //
  @MessagePattern(RABBITMQ_CONFIG.messagePatterns.POST_CREATED)
  async handlePostCreated(
    @Payload() data: { postId: number; files: Array<Express.Multer.File> },
    @Ctx() context: RmqContext,
  ): Promise<OutputFilesDto[]> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      await this.commandBus.execute<UploadFilesCreatedPostCommand, void>(
        new UploadFilesCreatedPostCommand(data.postId, data.files),
      );

      const result = await this.queryBus.execute<
        GetAllFilesByPostUserQuery,
        OutputFilesDto[] | null
      >(new GetAllFilesByPostUserQuery(data.postId));

      channel.ack(originalMsg);
      return result || [];
    } catch (error) {
      channel.nack(originalMsg);
      throw error;
    }
  }

  @MessagePattern(RABBITMQ_CONFIG.messagePatterns.POST_DELETED)
  async handlePostDeleted(
    @Payload() data: { postId: number },
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      await this.commandBus.execute<DeletedPostFileCommand, void>(
        new DeletedPostFileCommand(data.postId),
      );
      channel.ack(originalMsg);
    } catch (error) {
      channel.nack(originalMsg);
      throw error;
    }
  }

  @MessagePattern(RABBITMQ_CONFIG.messagePatterns.GET_USER_POSTS)
  async handleGetUserPosts(
    @Payload() data: { postIds: number[] },
    @Ctx() context: RmqContext,
  ): Promise<OutputFilesDto[]> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      const allFiles: OutputFilesDto[] = [];

      // Process each post ID to get all files
      for (const postId of data.postIds) {
        const files = await this.queryBus.execute<
          GetAllFilesByPostUserQuery,
          OutputFilesDto[] | null
        >(new GetAllFilesByPostUserQuery(postId));

        if (files && files.length > 0) {
          allFiles.push(...files);
        }
      }

      channel.ack(originalMsg);
      return allFiles;
    } catch (error) {
      channel.nack(originalMsg);
      throw error;
    }
  }
}
