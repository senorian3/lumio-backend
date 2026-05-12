import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ChatFilesController } from '@files/modules/chat-files/api/chat-files.controller';
import { InternalApiGuard } from '@files/core/guards/internal/internal-api.guard';
import { UploadChatFileCommand } from '@files/modules/chat-files/application/commands/upload-chat-file.command-handler';
import { DeleteChatFileCommand } from '@files/modules/chat-files/application/commands/delete-chat-file.command-handler';
import { ChatFileType } from '@files/modules/chat-files/api/dto/input/upload-chat-file.input.dto';

describe('ChatFilesController', () => {
  let controller: ChatFilesController;
  let commandBus: jest.Mocked<CommandBus>;

  const mockFile = {
    originalname: 'image.png',
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('test'),
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatFilesController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(InternalApiGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ChatFilesController>(ChatFilesController);
    commandBus = module.get(CommandBus);
  });

  describe('uploadChatFile', () => {
    it('should upload chat file and return file info', async () => {
      const dto = {
        userId: 1,
        chatId: 123,
        messageId: 'msg-1',
        fileType: ChatFileType.IMAGE,
      };

      const expectedResult = {
        fileKey: 'content/chats/123/1_image_1.png',
        url: 'https://example.com/content/chats/123/1_image_1.png',
        type: ChatFileType.IMAGE,
        size: 1024,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      };

      commandBus.execute.mockResolvedValue(expectedResult);

      const result = await controller.uploadChatFile(mockFile, dto);

      expect(result).toEqual(expectedResult);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new UploadChatFileCommand(
          mockFile,
          dto.userId,
          dto.chatId,
          dto.messageId,
          dto.fileType,
        ),
      );
    });

    it('should handle file upload with optional fields', async () => {
      const dto = {
        userId: 2,
        chatId: 456,
        messageId: 'msg-2',
        fileType: ChatFileType.VOICE,
      };

      commandBus.execute.mockResolvedValue({
        fileKey: 'content/chats/456/2_voice_1.mp3',
        url: 'https://example.com/content/chats/456/2_voice_1.mp3',
        type: ChatFileType.VOICE,
        size: 2048,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      const result = await controller.uploadChatFile(mockFile, dto);

      expect(result.type).toBe(ChatFileType.VOICE);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new UploadChatFileCommand(
          mockFile,
          dto.userId,
          dto.chatId,
          dto.messageId,
          dto.fileType,
        ),
      );
    });

    it('should propagate errors from command bus', async () => {
      const dto = {
        userId: 1,
        chatId: 123,
        messageId: 'msg-1',
        fileType: ChatFileType.IMAGE,
      };

      commandBus.execute.mockRejectedValue(new Error('Upload failed'));

      await expect(controller.uploadChatFile(mockFile, dto)).rejects.toThrow(
        'Upload failed',
      );
    });
  });

  describe('deleteChatFile', () => {
    it('should delete chat file by key', async () => {
      const fileKey = 'content/chats/123/1_image_1.png';

      commandBus.execute.mockResolvedValue({
        success: true,
        message: 'Chat file deleted successfully',
        fileKey,
      });

      const result = await controller.deleteChatFile(fileKey);

      expect(result).toEqual({
        success: true,
        message: 'Chat file deleted successfully',
        fileKey,
      });
      expect(commandBus.execute).toHaveBeenCalledWith(
        new DeleteChatFileCommand(fileKey),
      );
    });

    it('should propagate errors from command bus', async () => {
      const fileKey = 'non-existent-key.png';

      commandBus.execute.mockRejectedValue(new Error('Chat file not found'));

      await expect(controller.deleteChatFile(fileKey)).rejects.toThrow(
        'Chat file not found',
      );
    });
  });

  describe('getChatFile', () => {
    it('should return file key and URL', async () => {
      const fileKey = 'content/chats/123/1_image_1.png';

      const result = await controller.getChatFile(fileKey);

      expect(result).toEqual({
        fileKey,
        url: `https://s3.amazonaws.com/bucket/${fileKey}`,
      });
    });
  });
});
