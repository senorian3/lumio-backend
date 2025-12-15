import { IUploadedFile } from '@libs/interfaces/files.interface';
import { RABBITMQ_CONFIG } from '@libs/rabbitmq/rabbitmq.constants';
import { Controller } from '@nestjs/common';
import { MessagePattern, RpcException } from '@nestjs/microservices';

@Controller()
export class FilesController {
  constructor() {}

  @MessagePattern(RABBITMQ_CONFIG.messagePatterns.UPLOAD_FILES)
  async uploadFiles() // @Payload() data: IUploadFilesRequest,
  : Promise<IUploadedFile[]> {
    try {
      return;
      // await this.filesService.uploadFiles(data);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(RABBITMQ_CONFIG.messagePatterns.DELETE_FILES)
  async deleteFiles() // @Payload() data: IDeleteFilesRequest
  : Promise<void> {
    try {
      return;
      // await this.filesService.deleteFiles(data);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(RABBITMQ_CONFIG.messagePatterns.GET_FILE_URLS)
  async getFileUrls() // @Payload() data: { fileKeys: string[] },
  : Promise<Array<{ key: string; url: string }>> {
    try {
      return;
      // await this.filesService.getFileUrls(data.fileKeys);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(RABBITMQ_CONFIG.messagePatterns.POST_CREATED)
  async handlePostCreated() // @Payload() data: any
  : Promise<void> {
    // this.filesService.logEvent('POST_CREATED', data);
  }

  @MessagePattern(RABBITMQ_CONFIG.messagePatterns.POST_DELETED)
  async handlePostDeleted() // @Payload() data: any
  : Promise<void> {
    // this.filesService.logEvent('POST_DELETED', data);
  }
}
