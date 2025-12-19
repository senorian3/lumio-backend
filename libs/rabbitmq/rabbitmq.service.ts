import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RABBITMQ_CONFIG } from '@libs/rabbitmq/rabbitmq.constants';
import { OutputFilesDto } from '@libs/rabbitmq/dto/output';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  constructor(
    @Inject('RABBITMQ_CLIENT') private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('RabbitMQService: Connection error:', error);
      throw error;
    }
  }

  async sendRpc<T>(pattern: string, data: any): Promise<T> {
    try {
      const result = await firstValueFrom(this.client.send(pattern, data));

      return result;
    } catch (error) {
      throw error;
    }
  }

  async emitEvent(pattern: string, data: any): Promise<void> {
    this.client.emit(pattern, data);
  }

  // Методы для отправки событий о постах
  // async emitPostCreated(
  //   postId: number,
  //   files: Array<Express.Multer.File>,
  // ): Promise<void> {
  //   await this.emitEvent(RABBITMQ_CONFIG.routingKeys.POST_CREATED, {
  //     postId,
  //     files,
  //   });
  // }

  async emitPostDeleted(postId: number): Promise<void> {
    await this.emitEvent(RABBITMQ_CONFIG.routingKeys.POST_DELETED, {
      postId,
    });
  }

  async sendPostCreatedRpc(
    postId: number,
    files: Array<Express.Multer.File>,
  ): Promise<OutputFilesDto[]> {
    try {
      const result = await this.sendRpc<OutputFilesDto[]>(
        RABBITMQ_CONFIG.messagePatterns.POST_CREATED,
        { postId, files },
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getUsersPostsRpc(postIds: number[]): Promise<OutputFilesDto[]> {
    try {
      const result = await this.sendRpc<OutputFilesDto[]>(
        RABBITMQ_CONFIG.messagePatterns.GET_USER_POSTS,
        { postIds },
      );
      return result;
    } catch (error) {
      throw error;
    }
  }
}
