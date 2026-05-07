import { Test, TestingModule } from '@nestjs/testing';
import { DeleteChatFileCommandHandler } from '@files/modules/chat-files/application/commands/delete-chat-file.command-handler';
import { ChatFileRepository } from '@files/modules/chat-files/domain/infrastructure/chat-file.repository';
import { S3FilesHttpAdapter } from '@files/core/adapters/s3-files-http.adapter';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ChatFileType } from '@files/modules/chat-files/api/dto/input/upload-chat-file.input.dto';
import { ChatFileEntity } from '@files/modules/chat-files/domain/entities/chat-file.entity';

describe('DeleteChatFileCommandHandler', () => {
  let handler: DeleteChatFileCommandHandler;
  let chatFileRepository: jest.Mocked<ChatFileRepository>;
  let s3Adapter: jest.Mocked<S3FilesHttpAdapter>;

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
        DeleteChatFileCommandHandler,
        {
          provide: ChatFileRepository,
          useValue: {
            findByKey: jest.fn(),
            softDeleteByKey: jest.fn(),
          },
        },
        {
          provide: S3FilesHttpAdapter,
          useValue: {
            deleteFile: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<DeleteChatFileCommandHandler>(
      DeleteChatFileCommandHandler,
    );
    chatFileRepository = module.get(ChatFileRepository);
    s3Adapter = module.get(S3FilesHttpAdapter);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should delete chat file from S3 and soft delete from database', async () => {
      chatFileRepository.findByKey.mockResolvedValue(mockChatFileEntity);
      s3Adapter.deleteFile.mockResolvedValue(undefined);
      chatFileRepository.softDeleteByKey.mockResolvedValue(undefined);

      const result = await handler.execute({
        fileKey: 'content/chats/123/1_image_1.png',
      });

      expect(chatFileRepository.findByKey).toHaveBeenCalledWith(
        'content/chats/123/1_image_1.png',
      );
      expect(s3Adapter.deleteFile).toHaveBeenCalledWith(
        'content/chats/123/1_image_1.png',
      );
      expect(chatFileRepository.softDeleteByKey).toHaveBeenCalledWith(
        'content/chats/123/1_image_1.png',
      );
      expect(result).toEqual({
        success: true,
        message: 'Chat file deleted successfully',
        fileKey: 'content/chats/123/1_image_1.png',
      });
    });

    it('should throw NotFoundDomainException when file does not exist', async () => {
      chatFileRepository.findByKey.mockResolvedValue(null);

      await expect(
        handler.execute({
          fileKey: 'non-existent-key.png',
        }),
      ).rejects.toThrow(NotFoundDomainException);
    });

    it('should throw NotFoundDomainException with correct field', async () => {
      chatFileRepository.findByKey.mockResolvedValue(null);

      await expect(
        handler.execute({
          fileKey: 'non-existent-key.png',
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          extensions: expect.arrayContaining([
            expect.objectContaining({
              field: 'fileKey',
            }),
          ]),
        }),
      );
    });

    it('should handle S3 deletion error', async () => {
      chatFileRepository.findByKey.mockResolvedValue(mockChatFileEntity);
      s3Adapter.deleteFile.mockRejectedValue(new Error('S3 error'));

      await expect(
        handler.execute({
          fileKey: 'content/chats/123/1_image_1.png',
        }),
      ).rejects.toThrow('S3 error');
    });

    it('should handle repository soft delete error', async () => {
      chatFileRepository.findByKey.mockResolvedValue(mockChatFileEntity);
      s3Adapter.deleteFile.mockResolvedValue(undefined);
      chatFileRepository.softDeleteByKey.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        handler.execute({
          fileKey: 'content/chats/123/1_image_1.png',
        }),
      ).rejects.toThrow('Database error');
    });
  });
});
