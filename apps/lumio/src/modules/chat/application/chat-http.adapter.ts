import { CoreConfig } from '@lumio/core/core.config';
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ChatHttpAdapter {
  constructor(private readonly coreConfig: CoreConfig) {}

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
      const response = await axios.post<T>(url, payload, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
