import {
  Controller,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UploadFilesCreatedPostCommand } from '@files/application/use-cases/upload-post-file.usecase';
import { GetAllFilesByPostUserQuery } from '@files/application/queries/get-all-file-by-post.query-handler';
import { OutputFileByPostType } from '@files/api/dto/output/files-by-post.output-dto';

@Controller('files')
export class FilesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/:postId/upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @Param('postId') postId: number,
    @UploadedFiles()
    files: Array<Express.Multer.File>,
  ): Promise<OutputFileByPostType[] | null> {
    const formattedFiles = files.map((file) => ({
      buffer: file.buffer,
      originalname: file.originalname,
    }));

    await this.commandBus.execute<UploadFilesCreatedPostCommand, void>(
      new UploadFilesCreatedPostCommand(postId, formattedFiles),
    );

    return await this.queryBus.execute<
      GetAllFilesByPostUserQuery,
      OutputFileByPostType[] | null
    >(new GetAllFilesByPostUserQuery(postId));
  }

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
  // @MessagePattern(RABBITMQ_CONFIG.messagePatterns.POST_CREATED)
  // async handlePostCreated() // @Payload() data: any
  // : Promise<void> {
  //   // this.filesService.logEvent('POST_CREATED', data);
  // }
  //
  // @MessagePattern(RABBITMQ_CONFIG.messagePatterns.POST_DELETED)
  // async handlePostDeleted() // @Payload() data: any
  // : Promise<void> {
  //   // this.filesService.logEvent('POST_DELETED', data);
  // }
}
