import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { UploadFileResponse } from '@chat/core/adapters/dto/upload-file.response';
import { UploadFileDto } from '@chat/core/adapters/dto/upload-file.dto';
import { AppLoggerService } from '@libs/logger/logger.service';
import { buildInternalApiHeaders } from '@libs/core/internal-api/internal-api';

@Injectable()
export class FilesHttpAdapter {
  private readonly filesServiceUrl: string;
  private readonly internalApiKey: string;
  private readonly internalServiceName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly logger: AppLoggerService,
  ) {
    this.filesServiceUrl = this.configService.get<string>('FILES_SERVICE_URL');
    this.internalApiKey = this.configService.get<string>('INTERNAL_API_KEY');
    this.internalServiceName =
      this.configService.get<string>('INTERNAL_SERVICE_NAME') ?? 'chat';
  }

  async uploadFile(dto: UploadFileDto): Promise<UploadFileResponse> {
    try {
      const formData = new FormData();
      const blob = new Blob([dto.file.buffer as any], {
        type: dto.file.mimetype,
      });
      formData.append('file', blob, dto.file.originalname);
      formData.append('userId', String(dto.userId));
      formData.append('chatId', String(dto.chatId));
      formData.append('messageId', dto.messageId);
      if (dto.metadata?.type) {
        formData.append('fileType', dto.metadata.type);
      }

      const response = await firstValueFrom(
        this.httpService.post<{
          fileKey?: string;
          key?: string;
          url: string;
          size?: number;
          mimeType?: string;
          createdAt: string;
        }>(`${this.filesServiceUrl}/chat-files/upload`, formData, {
          headers: {
            ...buildInternalApiHeaders(
              this.internalServiceName,
              this.internalApiKey,
            ),
          },
        }),
      );

      if (
        !response.data?.url ||
        (!response.data.fileKey && !response.data.key)
      ) {
        throw BadRequestDomainException.create(
          'Failed to upload file to files service',
          'file',
        );
      }

      const fileKey = response.data.key ?? response.data.fileKey!;

      return {
        id: fileKey,
        url: response.data.url,
        key: fileKey,
        size: response.data.size ?? dto.file.size,
        mimeType: response.data.mimeType ?? dto.file.mimetype,
        createdAt: response.data.createdAt,
      };
    } catch (error) {
      this.logger.error(
        'Failed to upload file to files service',
        error instanceof Error ? error.stack : undefined,
        FilesHttpAdapter.name,
      );

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
          `${this.filesServiceUrl}/chat-files/${fileKey}`,
          {
            headers: {
              ...buildInternalApiHeaders(
                this.internalServiceName,
                this.internalApiKey,
              ),
            },
          },
        ),
      );
    } catch (error) {
      this.logger.warn(
        `Failed to delete file ${fileKey}: ${error instanceof Error ? error.message : String(error)}`,
        FilesHttpAdapter.name,
      );
    }
  }

  async getFileUrl(fileKey: string): Promise<string> {
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
