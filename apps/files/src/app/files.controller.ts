import {
  Controller,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CommandBus } from '@nestjs/cqrs';
import { UploadFilesCreatedPostCommand } from '@files/application/use-cases/upload-post-file.usecase';

@Controller('files')
export class FilesController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':userId/:postId/upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @Param('userId') userId: number,
    @Param('postId') postId: number,
    @UploadedFiles()
    files: Array<Express.Multer.File>,
  ) {
    const formattedFiles = files.map((file) => ({
      buffer: file.buffer,
      originalname: file.originalname,
    }));

    const idFilesArray = await this.commandBus.execute<
      UploadFilesCreatedPostCommand,
      number[]
    >(new UploadFilesCreatedPostCommand(userId, postId, formattedFiles));

    return idFilesArray;
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
