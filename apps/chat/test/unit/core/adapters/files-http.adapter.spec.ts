import { of } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { FilesHttpAdapter } from '@chat/core/adapters/files-http.adapter';
import { AttachmentType } from '@chat/modules/chats/domain/message-types.enum';
import { AppLoggerService } from '@libs/logger/logger.service';

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
          'x-internal-api-key': 'test-internal-key',
        },
      }),
    );
  });
});
