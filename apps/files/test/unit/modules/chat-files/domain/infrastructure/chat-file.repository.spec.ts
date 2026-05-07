import { Test, TestingModule } from '@nestjs/testing';
import { ChatFileRepository } from '@files/modules/chat-files/domain/infrastructure/chat-file.repository';
import { PrismaService } from '@files/prisma/prisma.service';
import { ChatFileType } from '@files/modules/chat-files/api/dto/input/upload-chat-file.input.dto';
import { CreateChatFileDomainDto } from '@files/modules/chat-files/domain/dto/create-chat-file.domain.dto';

describe('ChatFileRepository', () => {
  let repository: ChatFileRepository;
  let prisma: {
    chatFile: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  const mockChatFile = {
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
        ChatFileRepository,
        {
          provide: PrismaService,
          useValue: {
            chatFile: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<ChatFileRepository>(ChatFileRepository);
    prisma = module.get(PrismaService) as any;
  });

  describe('create', () => {
    it('should create a chat file', async () => {
      const dto = new CreateChatFileDomainDto(
        'content/chats/123/1_image_1.png',
        'https://example.com/content/chats/123/1_image_1.png',
        ChatFileType.IMAGE,
        1024,
        1,
        123,
        'msg-1',
        'image.png',
        'image/png',
      );

      prisma.chatFile.create.mockResolvedValue(mockChatFile);

      const result = await repository.create(dto);

      expect(result).toEqual(mockChatFile);
      expect(prisma.chatFile.create).toHaveBeenCalledWith({
        data: {
          key: dto.key,
          url: dto.url,
          type: dto.type,
          size: dto.size,
          userId: dto.userId,
          chatId: dto.chatId,
          messageId: dto.messageId,
          originalName: dto.originalName,
          mimeType: dto.mimeType,
        },
      });
    });
  });

  describe('findByKey', () => {
    it('should find a chat file by key', async () => {
      prisma.chatFile.findFirst.mockResolvedValue(mockChatFile);

      const result = await repository.findByKey(
        'content/chats/123/1_image_1.png',
      );

      expect(result).toEqual(mockChatFile);
      expect(prisma.chatFile.findFirst).toHaveBeenCalledWith({
        where: {
          key: 'content/chats/123/1_image_1.png',
          deletedAt: null,
        },
      });
    });

    it('should return null when file not found', async () => {
      prisma.chatFile.findFirst.mockResolvedValue(null);

      const result = await repository.findByKey('non-existent-key.png');

      expect(result).toBeNull();
    });
  });

  describe('findByMessageId', () => {
    it('should find chat files by message id', async () => {
      prisma.chatFile.findMany.mockResolvedValue([mockChatFile]);

      const result = await repository.findByMessageId('msg-1');

      expect(result).toEqual([mockChatFile]);
      expect(prisma.chatFile.findMany).toHaveBeenCalledWith({
        where: {
          messageId: 'msg-1',
          deletedAt: null,
        },
      });
    });

    it('should return empty array when no files found', async () => {
      prisma.chatFile.findMany.mockResolvedValue([]);

      const result = await repository.findByMessageId('non-existent-msg');

      expect(result).toEqual([]);
    });
  });

  describe('findByChatId', () => {
    it('should find chat files by chat id', async () => {
      prisma.chatFile.findMany.mockResolvedValue([mockChatFile]);

      const result = await repository.findByChatId(123);

      expect(result).toEqual([mockChatFile]);
      expect(prisma.chatFile.findMany).toHaveBeenCalledWith({
        where: {
          chatId: 123,
          deletedAt: null,
        },
      });
    });

    it('should return empty array when no files found', async () => {
      prisma.chatFile.findMany.mockResolvedValue([]);

      const result = await repository.findByChatId(999);

      expect(result).toEqual([]);
    });
  });

  describe('softDeleteByKey', () => {
    it('should soft delete a chat file by key', async () => {
      prisma.chatFile.update.mockResolvedValue(mockChatFile);

      await repository.softDeleteByKey('content/chats/123/1_image_1.png');

      expect(prisma.chatFile.update).toHaveBeenCalledWith({
        where: { key: 'content/chats/123/1_image_1.png' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('softDeleteByMessageId', () => {
    it('should soft delete chat files by message id', async () => {
      prisma.chatFile.updateMany.mockResolvedValue({ count: 1 } as any);

      await repository.softDeleteByMessageId('msg-1');

      expect(prisma.chatFile.updateMany).toHaveBeenCalledWith({
        where: { messageId: 'msg-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
