import { CoreConfig } from '@lumio/core/core.config';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';
import { buildInternalApiHeaders } from '@libs/core/internal-api/internal-api';

@Injectable()
export class FilesHttpAdapter {
  constructor(private readonly coreConfig: CoreConfig) {}

  private getHeaders(additionalHeaders?: Record<string, string>) {
    return {
      ...buildInternalApiHeaders(
        this.coreConfig.internalServiceName,
        this.coreConfig.internalApiKey,
      ),
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
      throw error;
    }
  }

  async uploadFiles<T>(
    endpoint: string,
    postId: string,
    userId: number,
    files: Array<Express.Multer.File>,
  ): Promise<T> {
    const url = `${this.coreConfig.filesFrontendUrl}/${endpoint}`;
    const formData = new FormData();

    formData.append('postId', postId.toString());
    formData.append('userId', userId.toString());

    files.forEach((file) => {
      formData.append('files', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
    });

    const headers = {
      ...buildInternalApiHeaders(
        this.coreConfig.internalServiceName,
        this.coreConfig.internalApiKey,
      ),
      ...formData.getHeaders(),
    };

    try {
      const response = await axios.post<T>(url, formData, { headers });
      return response.data;
    } catch (error) {
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
      ...buildInternalApiHeaders(
        this.coreConfig.internalServiceName,
        this.coreConfig.internalApiKey,
      ),
      ...formData.getHeaders(),
    };

    try {
      const response = await axios.post<T>(url, formData, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteUserAvatar<T>(userId: number): Promise<T> {
    const url = `${this.coreConfig.filesFrontendUrl}/api/v1/profile/${userId}`;
    const headers = this.getHeaders();

    try {
      const response = await axios.delete<T>(url, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteFile<T>(key: string): Promise<T> {
    const url = `${this.coreConfig.filesFrontendUrl}/api/v1/files/delete-file/${key}`;
    const headers = this.getHeaders();

    try {
      const response = await axios.delete<T>(url, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deletePostFiles<T>(postId: string): Promise<T> {
    const url = `${this.coreConfig.filesFrontendUrl}/api/v1/files/delete-post-files/${postId}`;
    const headers = this.getHeaders();

    try {
      const response = await axios.delete<T>(url, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
