import { CoreConfig } from '@lumio/core/core.config';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';

@Injectable()
export class ChatHttpAdapter {
  constructor(
    private readonly coreConfig: CoreConfig,
    private readonly httpService: HttpService,
  ) {}

  private getHeaders(additionalHeaders?: Record<string, string>) {
    return {
      'X-Internal-API-Key': this.coreConfig.internalApiKey,
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };
  }

  async sendMessage<T>(
    endpoint: string,
    userId: number,
    recipientId: number,
    message: string,
  ): Promise<T> {
    const url = `${this.coreConfig.chatFrontendUrl}/${endpoint}`;
    const headers = this.getHeaders();
    const payload = { userId, recipientId, message };

    try {
      const response = await lastValueFrom(
        this.httpService.post<T>(url, payload, { headers }),
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getChatMessages<T>(
    endpoint: string,
    userId: number,
    recipientId: number,
    page: number,
    limit: number,
  ): Promise<T> {
    const url = `${this.coreConfig.chatFrontendUrl}/${endpoint}`;
    const headers = this.getHeaders();
    const payload = { userId, recipientId, page, limit };

    try {
      const response = await lastValueFrom(
        this.httpService.get<T>(url, { headers, params: payload }),
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async markMessageAsRead<T>(
    endpoint: string,
    messageId: string,
    userId: number,
  ): Promise<T> {
    const url = `${this.coreConfig.chatFrontendUrl}/${endpoint}/${messageId}/read`;
    const headers = this.getHeaders();
    const payload = { userId };

    try {
      const response = await lastValueFrom(
        this.httpService.post<T>(url, payload, { headers }),
      );
      return response.data;
    } catch (error) {
      if (error.response.status === 404) {
        throw NotFoundDomainException.create(
          'Message not found or already read',
          'messageId',
        );
      } else {
        throw error;
      }
    }
  }
}
