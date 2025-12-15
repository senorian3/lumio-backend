import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RABBITMQ_CONFIG } from '@libs/rabbitmq/rabbitmq.constants';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  constructor(
    @Inject('RABBITMQ_CLIENT') private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.client.connect();
  }

  async sendRpc<T>(pattern: string, data: any): Promise<T> {
    return await firstValueFrom(this.client.send(pattern, data));
  }

  async emitEvent(pattern: string, data: any): Promise<void> {
    this.client.emit(pattern, data);
  }

  // Специфичные методы для работы с файлами
  //   async uploadFiles(
  //     files: Express.Multer.File[],
  //     userId: string,
  //     postId?: string,
  //   ): Promise<IUploadedFile[]> {
  //     const request: uploadilesRequestType = {
  //       files: files.map((file) => ({
  //         buffer: file.buffer,
  //         originalname: file.originalname,
  //         mimetype: file.mimetype,
  //         size: file.size,
  //       })),
  //       userId,
  //       postId,
  //     };

  //     return this.sendRpc<uploadilesRequestType[]>(
  //       RABBITMQ_CONFIG.routingKeys.FILES_UPLOAD,
  //       request,
  //     );
  //   }

  //   async deleteFiles(fileKeys: string[], userId: string): Promise<void> {
  //     const request: deleteFilesRequestType = { fileKeys, userId };
  //     return this.sendRpc(RABBITMQ_CONFIG.routingKeys.FILES_DELETE, request);
  //   }

  // Методы для отправки событий о постах
  async emitPostCreated(
    postId: string,
    userId: string,
    fileKeys: string[],
  ): Promise<void> {
    await this.emitEvent(RABBITMQ_CONFIG.routingKeys.POST_CREATED, {
      postId,
      userId,
      fileKeys,
      timestamp: new Date(),
    });
  }

  async emitPostDeleted(
    postId: string,
    userId: string,
    fileKeys: string[],
  ): Promise<void> {
    await this.emitEvent(RABBITMQ_CONFIG.routingKeys.POST_DELETED, {
      postId,
      userId,
      fileKeys,
      timestamp: new Date(),
    });
  }
}
