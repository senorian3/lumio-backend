import { of, throwError } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { FilesHttpAdapter } from '@chat/core/adapters/files-http.adapter';
import { AttachmentType } from '@chat/modules/chats/domain/message-types.enum';
import { AppLoggerService } from '@libs/logger/logger.service';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';

describe('FilesHttpAdapter', () => {
  let adapter: FilesHttpAdapter;
  let httpService: jest.Mocked<HttpService>;
  let logger: jest.Mocked<AppLoggerService>;

  beforeEach(() => {
    httpService = {
      post: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;
    logger = {
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as jest.Mocked<AppLoggerService>;

    const configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const values: Record<string, string> = {
          FILES_SERVICE_URL: 'http://files-service/api/v1',
          INTERNAL_API_KEY: 'test-internal-key',
          INTERNAL_SERVICE_NAME: 'chat',
        };
        return values[key] ?? defaultValue;
      }),
    } as unknown as ConfigService;

    adapter = new FilesHttpAdapter(configService, httpService, logger);
  });

  it('uses configured internal credentials and chat file payload when uploading media', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          fileKey: 'file-1',
          url: 'http://files/file-1',
          size: 10,
          createdAt: '2026-04-22T10:00:00.000Z',
        },
      } as any),
    );

    await adapter.uploadFile({
      file: {
        buffer: Buffer.from('content'),
        mimetype: 'image/png',
        originalname: 'test.png',
      } as Express.Multer.File,
      userId: 7,
      chatId: 15,
      messageId: 'message-1',
      metadata: {
        type: AttachmentType.IMAGE,
      },
    });

    const [, formData, config] = httpService.post.mock.calls[0];

    expect(httpService.post).toHaveBeenCalledWith(
      'http://files-service/api/v1/chat-files/upload',
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-internal-service': 'chat',
          'x-internal-api-key': 'test-internal-key',
        }),
      }),
    );
    expect((formData as FormData).has('file')).toBe(true);
    expect((formData as FormData).get('userId')).toBe('7');
    expect((formData as FormData).get('chatId')).toBe('15');
    expect((formData as FormData).get('messageId')).toBe('message-1');
    expect((formData as FormData).get('fileType')).toBe('IMAGE');
    expect(config.headers['Content-Type']).toBeUndefined();
  });

  it('sends internal credentials when deleting a media file', async () => {
    httpService.delete.mockReturnValue(of({ data: {} } as any));

    await adapter.deleteFile('file-1');

    expect(httpService.delete).toHaveBeenCalledWith(
      'http://files-service/api/v1/chat-files/file-1',
      expect.objectContaining({
        headers: {
          'x-internal-service': 'chat',
          'x-internal-api-key': 'test-internal-key',
        },
      }),
    );
  });

  it('throws BadRequestDomainException when upload response has no url', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          fileKey: 'file-1',
          createdAt: '2026-04-22T10:00:00.000Z',
        },
      } as any),
    );

    await expect(
      adapter.uploadFile({
        file: {
          buffer: Buffer.from('content'),
          mimetype: 'image/png',
          originalname: 'test.png',
        } as Express.Multer.File,
        userId: 7,
        chatId: 15,
        messageId: 'message-1',
      }),
    ).rejects.toThrow(BadRequestDomainException);
  });

  it('throws BadRequestDomainException when upload response has no fileKey or key', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          url: 'http://files/file-1',
          createdAt: '2026-04-22T10:00:00.000Z',
        },
      } as any),
    );

    await expect(
      adapter.uploadFile({
        file: {
          buffer: Buffer.from('content'),
          mimetype: 'image/png',
          originalname: 'test.png',
        } as Express.Multer.File,
        userId: 7,
        chatId: 15,
        messageId: 'message-1',
      }),
    ).rejects.toThrow(BadRequestDomainException);
  });

  it('throws BadRequestDomainException on Axios error from files service', async () => {
    const axiosError = new AxiosError(
      'Service unavailable',
      '500',
      undefined,
      undefined,
      {
        status: 500,
        data: { message: 'Internal server error' },
      } as any,
    );
    httpService.post.mockReturnValue(throwError(() => axiosError));

    await expect(
      adapter.uploadFile({
        file: {
          buffer: Buffer.from('content'),
          mimetype: 'image/png',
          originalname: 'test.png',
        } as Express.Multer.File,
        userId: 7,
        chatId: 15,
        messageId: 'message-1',
      }),
    ).rejects.toThrow(BadRequestDomainException);
  });

  it('does not throw on delete failure', async () => {
    httpService.delete.mockReturnValue(
      throwError(() => new Error('Delete failed')),
    );

    await expect(adapter.deleteFile('file-1')).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('validates image file size', () => {
    const file = {
      size: 2 * 1024 * 1024, // 2 MB
      mimetype: 'image/png',
    } as Express.Multer.File;

    expect(() => adapter.validateImageFile(file)).toThrow(
      BadRequestDomainException,
    );
  });

  it('validates image file mime type', () => {
    const file = {
      size: 100,
      mimetype: 'application/pdf',
    } as Express.Multer.File;

    expect(() => adapter.validateImageFile(file)).toThrow(
      BadRequestDomainException,
    );
  });

  it('passes validation for valid image file', () => {
    const file = {
      size: 500 * 1024, // 500 KB
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    expect(() => adapter.validateImageFile(file)).not.toThrow();
  });

  it('validates voice file size', () => {
    const file = {
      size: 4 * 1024 * 1024, // 4 MB
      mimetype: 'audio/mpeg',
    } as Express.Multer.File;

    expect(() => adapter.validateVoiceFile(file)).toThrow(
      BadRequestDomainException,
    );
  });

  it('validates voice file mime type', () => {
    const file = {
      size: 100,
      mimetype: 'video/mp4',
    } as Express.Multer.File;

    expect(() => adapter.validateVoiceFile(file)).toThrow(
      BadRequestDomainException,
    );
  });

  it('passes validation for valid voice file', () => {
    const file = {
      size: 2 * 1024 * 1024, // 2 MB
      mimetype: 'audio/ogg',
    } as Express.Multer.File;

    expect(() => adapter.validateVoiceFile(file)).not.toThrow();
  });

  it('returns file URL from getFileUrl', async () => {
    const url = await adapter.getFileUrl('file-1');

    expect(url).toBe('http://files-service/api/v1/files/file-1');
  });
});
