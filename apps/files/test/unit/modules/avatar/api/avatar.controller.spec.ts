import { Test, TestingModule } from '@nestjs/testing';
import { AvatarController } from '@files/modules/avatar/api/avatar.controller';
import { CommandBus } from '@nestjs/cqrs';
import { InternalApiGuard } from '@files/core/guards/internal/internal-api.guard';

describe('AvatarController', () => {
  let avatarController: AvatarController;
  let commandBus: jest.Mocked<CommandBus>;

  const mockFile = {
    originalname: 'avatar.jpg',
    mimetype: 'image/jpeg',
    size: 1024 * 1024, // 1MB
    buffer: Buffer.from('test'),
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvatarController],
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

    avatarController = module.get<AvatarController>(AvatarController);
    commandBus = module.get(CommandBus);
  });

  describe('uploadUserAvatar', () => {
    it('should upload user avatar and return URL', async () => {
      const userId = '1';
      const expectedUrl = 'https://example.com/avatars/user-1.jpg';

      commandBus.execute.mockResolvedValue(expectedUrl);

      const result = await avatarController.uploadUserAvatar(mockFile, userId);

      expect(result).toEqual({ url: expectedUrl });
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1, avatar: mockFile }),
      );
    });

    it('should handle string userId conversion', async () => {
      const userId = '123';
      const expectedUrl = 'https://example.com/avatars/user-123.jpg';

      commandBus.execute.mockResolvedValue(expectedUrl);

      const result = await avatarController.uploadUserAvatar(mockFile, userId);

      expect(result.url).toBe(expectedUrl);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 123 }),
      );
    });

    it('should throw error when file is missing', async () => {
      const userId = '1';

      commandBus.execute.mockRejectedValue(new Error('File is required'));

      await expect(
        avatarController.uploadUserAvatar(undefined as any, userId),
      ).rejects.toThrow('File is required');
    });
  });

  describe('deleteUserAvatar', () => {
    it('should delete user avatar', async () => {
      const userId = 1;

      commandBus.execute.mockResolvedValue(undefined);

      await avatarController.deleteUserAvatar(userId);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
      );
    });

    it('should handle non-existent user avatar', async () => {
      const userId = 999; // Non-existent user

      commandBus.execute.mockResolvedValue(undefined);

      await avatarController.deleteUserAvatar(userId);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
      );
    });
  });
});
