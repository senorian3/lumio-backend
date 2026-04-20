import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';

export interface UploadFileResponse {
  id: string;
  url: string;
  key: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

export interface UploadFileDto {
  file: Express.Multer.File;
  userId: number;
  metadata?: {
    type?: 'IMAGE' | 'VOICE';
    duration?: number; // for voice messages in seconds
    width?: number; // for images
    height?: number; // for images
  };
}

@Injectable()
export class FilesHttpAdapter {
  private readonly logger = new Logger(FilesHttpAdapter.name);
  private readonly filesServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.filesServiceUrl = this.configService.get<string>(
      'FILES_SERVICE_URL',
      'http://localhost:3001/api/v1',
    );
  }

  async uploadFile(dto: UploadFileDto): Promise<UploadFileResponse> {
    try {
      const formData = new FormData();
      const blob = new Blob([dto.file.buffer as any], {
        type: dto.file.mimetype,
      });
      formData.append('files', blob, dto.file.originalname);

      const response = await firstValueFrom(
        this.httpService.post<UploadFileResponse[]>(
          `${this.filesServiceUrl}/chat-files/upload`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'x-internal-api-key': 'internal-api-key',
            },
          },
        ),
      );

      if (!response.data || response.data.length === 0) {
        throw BadRequestDomainException.create(
          'Failed to upload file to files service',
          'file',
        );
      }

      const fileData = response.data[0];

      // Add metadata to the response
      return {
        ...fileData,
        // Include additional metadata from the request
        ...(dto.metadata?.duration && { duration: dto.metadata.duration }),
        ...(dto.metadata?.width && { width: dto.metadata.width }),
        ...(dto.metadata?.height && { height: dto.metadata.height }),
      };
    } catch (error) {
      this.logger.error('Failed to upload file to files service', error);

      if (error instanceof AxiosError) {
        throw BadRequestDomainException.create(
          `Files service error: ${error.response?.data?.message || error.message}`,
          'file',
        );
      }

      throw BadRequestDomainException.create('Failed to upload file', 'file');
    }
  }

  async deleteFile(fileKey: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(
          `${this.filesServiceUrl}/files/delete-file/${fileKey}`,
        ),
      );
    } catch (error) {
      this.logger.warn(`Failed to delete file ${fileKey}`, error);
      // Don't throw error for deletion failures in chat context
      // The file will remain in storage but won't affect chat functionality
    }
  }

  async getFileUrl(fileKey: string): Promise<string> {
    // In a real implementation, this would construct the URL based on storage configuration
    // For S3, it would be: https://bucket.s3.region.amazonaws.com/key
    // For now, return a placeholder
    return `${this.filesServiceUrl}/files/${fileKey}`;
  }

  validateImageFile(file: Express.Multer.File): void {
    const maxSize = 1 * 1024 * 1024; // 1 MB
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (file.size > maxSize) {
      throw BadRequestDomainException.create(
        'Image size exceeds 1 MB limit',
        'file',
      );
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw BadRequestDomainException.create(
        `Unsupported image type: ${file.mimetype}. Allowed: ${allowedMimeTypes.join(', ')}`,
        'file',
      );
    }
  }

  validateVoiceFile(file: Express.Multer.File): void {
    const maxSize = 3 * 1024 * 1024; // 3 MB
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
    ];

    if (file.size > maxSize) {
      throw BadRequestDomainException.create(
        'Voice message size exceeds 3 MB limit',
        'file',
      );
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw BadRequestDomainException.create(
        `Unsupported audio type: ${file.mimetype}. Allowed: ${allowedMimeTypes.join(', ')}`,
        'file',
      );
    }
  }
}
