import { Controller } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UploadFilesCreatedPostCommand } from '@files/application/use-cases/upload-post-file.usecase';
import { GetAllFilesByPostUserQuery } from '@files/application/queries/get-all-file-by-post.query-handler';
import { MessagePattern, Payload } from '@nestjs/microservices/decorators';
import { RABBITMQ_CONFIG } from '@libs/rabbitmq/rabbitmq.constants';
import { OutputFilesDto } from '@libs/rabbitmq/dto/output';

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
  ): Promise<OutputFilesDto[]> {
    console.log('=== FILES CONTROLLER ===');
    console.log('Received POST_CREATED message:', data);
    console.log('postId:', data.postId, 'files count:', data.files?.length);

    try {
      console.log('Executing UploadFilesCreatedPostCommand...');
      await this.commandBus.execute<UploadFilesCreatedPostCommand, void>(
        new UploadFilesCreatedPostCommand(data.postId, data.files),
      );

      console.log('Executing GetAllFilesByPostUserQuery...');
      const result = await this.queryBus.execute<
        GetAllFilesByPostUserQuery,
        OutputFilesDto[] | null
      >(new GetAllFilesByPostUserQuery(data.postId));

      console.log('Query result:', result);
      return result || [];
    } catch (error) {
      console.error('Error in handlePostCreated:', error);
      throw error;
    }
  }
  //
  // @MessagePattern(RABBITMQ_CONFIG.messagePatterns.POST_DELETED)
  // async handlePostDeleted() // @Payload() data: any
  // : Promise<void> {
  //   // this.filesService.logEvent('POST_DELETED', data);
  // }
}
