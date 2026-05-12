import { Test, TestingModule } from '@nestjs/testing';
import { UploadChatFileCommandHandler } from '@files/modules/chat-files/application/commands/upload-chat-file.command-handler';
import { ChatFileRepository } from '@files/modules/chat-files/domain/infrastructure/chat-file.repository';
import { S3FilesHttpAdapter } from '@files/core/adapters/s3-files-http.adapter';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ChatFileType } from '@files/modules/chat-files/api/dto/input/upload-chat-file.input.dto';
import { ChatFileEntity } from '@files/modules/chat-files/domain/entities/chat-file.entity';
import { PostFileEntity } from '@files/modules/post-files/domain/entities/post-file.entity';

describe('UploadChatFileCommandHandler', () => {
  let handler: UploadChatFileCommandHandler;
  let chatFileRepository: jest.Mocked<ChatFileRepository>;
  let s3Adapter: jest.Mocked<S3FilesHttpAdapter>;

  const mockFile = {
    originalname: 'image.png',
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('test'),
  } as Express.Multer.File;

  const mockUploadedFile: PostFileEntity = {
    id: 1,
    key: 'content/chats/123/1_image_1.png',
    url: 'https://example.com/content/chats/123/1_image_1.png',
    mimetype: 'image/png',
    size: 1024,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    postId: 'post-123',
    userId: 1,
  };

  const mockChatFileEntity: ChatFileEntity = {
    id: 1,
    key: 'content/chats/123/1_image_1.png',
    url: 'https://example.com/content/chats/123/1_image_1.png',
    type: ChatFileType.IMAGE,
    size: 1024,
    originalName: 'image.png',
    mimeType: 'image/png',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    userId: 1,
    chatId: 123,
    messageId: 'msg-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadChatFileCommandHandler,
        {
          provide: ChatFileRepository,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: S3FilesHttpAdapter,
          useValue: {
            uploadFiles: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<UploadChatFileCommandHandler>(
      UploadChatFileCommandHandler,
    );
    chatFileRepository = module.get(ChatFileRepository);
    s3Adapter = module.get(S3FilesHttpAdapter);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should upload file to S3 and save to database', async () => {
      s3Adapter.uploadFiles.mockResolvedValue([mockUploadedFile]);
      chatFileRepository.create.mockResolvedValue(mockChatFileEntity);

      const result = await handler.execute({
        file: mockFile,
        userId: 1,
        chatId: 123,
        messageId: 'msg-1',
        fileType: ChatFileType.IMAGE,
      });

      expect(s3Adapter.uploadFiles).toHaveBeenCalledWith('chats', 123, [
        mockFile,
      ]);
      expect(chatFileRepository.create).toHaveBeenCalledWith({
        key: mockUploadedFile.key,
        url: mockUploadedFile.url,
        type: ChatFileType.IMAGE,
        size: mockFile.size,
        userId: 1,
        chatId: 123,
        messageId: 'msg-1',
        originalName: mockFile.originalname,
        mimeType: mockFile.mimetype,
      });
      expect(result).toEqual({
        fileKey: mockChatFileEntity.key,
        url: mockChatFileEntity.url,
        type: mockChatFileEntity.type,
        size: mockChatFileEntity.size,
        createdAt: mockChatFileEntity.createdAt,
      });
    });

    it('should throw BadRequestDomainException when file is missing', async () => {
      await expect(
        handler.execute({
          file: undefined as any,
          userId: 1,
          chatId: 123,
          messageId: 'msg-1',
          fileType: ChatFileType.IMAGE,
        }),
      ).rejects.toThrow(BadRequestDomainException);
    });

    it('should throw BadRequestDomainException when file has no buffer', async () => {
      await expect(
        handler.execute({
          file: { originalname: 'test.png' } as Express.Multer.File,
          userId: 1,
          chatId: 123,
          messageId: 'msg-1',
          fileType: ChatFileType.IMAGE,
        }),
      ).rejects.toThrow(BadRequestDomainException);
    });

    it('should throw BadRequestDomainException when S3 upload fails', async () => {
      s3Adapter.uploadFiles.mockResolvedValue([]);

      await expect(
        handler.execute({
          file: mockFile,
          userId: 1,
          chatId: 123,
          messageId: 'msg-1',
          fileType: ChatFileType.IMAGE,
        }),
      ).rejects.toThrow(BadRequestDomainException);
    });

    it('should throw BadRequestDomainException when S3 returns null', async () => {
      s3Adapter.uploadFiles.mockResolvedValue(null as any);

      await expect(
        handler.execute({
          file: mockFile,
          userId: 1,
          chatId: 123,
          messageId: 'msg-1',
          fileType: ChatFileType.IMAGE,
        }),
      ).rejects.toThrow(BadRequestDomainException);
    });

    it('should handle repository error', async () => {
      s3Adapter.uploadFiles.mockResolvedValue([mockUploadedFile]);
      chatFileRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(
        handler.execute({
          file: mockFile,
          userId: 1,
          chatId: 123,
          messageId: 'msg-1',
          fileType: ChatFileType.IMAGE,
        }),
      ).rejects.toThrow('Database error');
    });
  });
});
