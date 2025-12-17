import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { RABBITMQ_CONFIG } from '@libs/rabbitmq/rabbitmq.constants';
import { OutputFilesDto } from '@libs/rabbitmq/dto/output';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  constructor(
    @Inject('RABBITMQ_CLIENT') private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    console.log('RabbitMQService: Connecting to RabbitMQ...');
    try {
      await this.client.connect();
      console.log('RabbitMQService: Successfully connected to RabbitMQ');
    } catch (error) {
      console.error('RabbitMQService: Connection error:', error);
      throw error;
    }
  }

  async sendRpc<T>(pattern: string, data: any): Promise<T> {
    console.log('sendRpc called with pattern:', pattern, 'data:', data);
    try {
      // Добавляем таймаут 10 секунд для RPC вызова
      const result = await firstValueFrom(this.client.send(pattern, data));

      console.log('sendRpc success, result:', result);
      return result;
    } catch (error) {
      console.error('sendRpc error:', error);
      throw error;
    }
  }

  async emitEvent(pattern: string, data: any): Promise<void> {
    this.client.emit(pattern, data);
  }

  // Методы для отправки событий о постах
  async emitPostCreated(
    postId: number,
    files: Array<Express.Multer.File>,
  ): Promise<void> {
    await this.emitEvent(RABBITMQ_CONFIG.routingKeys.POST_CREATED, {
      postId,
      files,
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

  async sendPostCreatedRpc(
    postId: number,
    files: Array<Express.Multer.File>,
  ): Promise<OutputFilesDto[]> {
    console.log('Sending RPC for post:', postId, 'files count:', files.length);
    try {
      const result = await this.sendRpc<OutputFilesDto[]>(
        RABBITMQ_CONFIG.messagePatterns.POST_CREATED,
        { postId, files },
      );
      console.log('RPC result:', result);
      return result;
    } catch (error) {
      console.error('RPC error:', error);
      throw error;
    }
  }
}
