import { AppLoggerService } from '@libs/logger/logger.service';
import { CoreConfig } from '@lumio/core/core.config';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class FilesHttpAdapter {
  constructor(
    private readonly coreConfig: CoreConfig,
    private readonly loggerService: AppLoggerService,
  ) {}

  private getHeaders(additionalHeaders?: Record<string, string>) {
    return {
      'X-Internal-API-Key': this.coreConfig.internalApiKey,
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };
  }

  async delete<T>(
    endpoint: string,
    additionalHeaders?: Record<string, string>,
  ): Promise<T> {
    const url = `${this.coreConfig.filesFrontendUrl}/${endpoint}`;
    const headers = this.getHeaders(additionalHeaders);

    try {
      const response = await axios.delete<T>(url, { headers });
      return response.data;
    } catch (error) {
      this.loggerService.error(
        `Failed to DELETE from ${url}:`,
        error?.stack,
        FilesHttpAdapter.name,
      );
      throw error;
    }
  }

  async uploadFiles<T>(
    endpoint: string,
    postId: number,
    files: Array<Express.Multer.File>,
  ): Promise<T> {
    const url = `${this.coreConfig.filesFrontendUrl}/${endpoint}`;
    const formData = new FormData();

    formData.append('postId', postId.toString());

    files.forEach((file) => {
      formData.append('files', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
    });

    const headers = {
      'X-Internal-API-Key': this.coreConfig.internalApiKey,
      ...formData.getHeaders(),
    };

    try {
      const response = await axios.post<T>(url, formData, { headers });
      return response.data;
    } catch (error) {
      this.loggerService.error(
        `Failed to POST to ${url}:`,
        error?.stack,
        FilesHttpAdapter.name,
      );
      throw error;
    }
  }

  async uploadUserAvatar<T>(
    endpoint: string,
    userId: number,
    avatar: Express.Multer.File,
  ): Promise<T> {
    const url = `${this.coreConfig.filesFrontendUrl}/${endpoint}`;
    const formData = new FormData();

    formData.append('userId', userId.toString());
    formData.append('avatar', avatar.buffer, {
      filename: avatar.originalname,
      contentType: avatar.mimetype,
    });

    const headers = {
      'X-Internal-API-Key': this.coreConfig.internalApiKey,
      ...formData.getHeaders(),
    };

    try {
      const response = await axios.post<T>(url, formData, { headers });
      return response.data;
    } catch (error) {
      this.loggerService.error(
        `Failed to upload avatar to ${url}:`,
        error?.stack,
        FilesHttpAdapter.name,
      );
      throw error;
    }
  }
}
