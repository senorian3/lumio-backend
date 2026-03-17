import { Test, TestingModule } from '@nestjs/testing';
import {
  DeleteNotificationCommand,
  DeleteNotificationCommandHandler,
} from '@lumio/modules/notifications/application/commands/delete-notification.command.handler';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.repository';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';

describe('DeleteNotificationCommandHandler', () => {
  let handler: DeleteNotificationCommandHandler;
  let mockNotificationRepository: jest.Mocked<NotificationRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteNotificationCommandHandler,
        {
          provide: NotificationRepository,
          useValue: {
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<DeleteNotificationCommandHandler>(
      DeleteNotificationCommandHandler,
    );
    mockNotificationRepository = module.get(NotificationRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const notificationId = 'notification-123';
    const userId = 1;

    it('should successfully delete notification', async () => {
      // Arrange
      mockNotificationRepository.softDelete.mockResolvedValue(true);
      const command = new DeleteNotificationCommand(notificationId, userId);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockNotificationRepository.softDelete).toHaveBeenCalledWith(
        notificationId,
        userId,
      );
    });

    it('should throw NotFoundDomainException when notification not found', async () => {
      // Arrange
      mockNotificationRepository.softDelete.mockResolvedValue(false);
      const command = new DeleteNotificationCommand(notificationId, userId);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundDomainException,
      );
    });

    it('should throw NotFoundDomainException with correct field', async () => {
      // Arrange
      mockNotificationRepository.softDelete.mockResolvedValue(false);
      const command = new DeleteNotificationCommand(notificationId, userId);

      // Act & Assert
      try {
        await handler.execute(command);
        fail('Expected NotFoundDomainException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundDomainException);
        expect(error.extensions).toEqual(
          expect.arrayContaining([expect.objectContaining({ field: 'id' })]),
        );
      }
    });

    it('should propagate database errors', async () => {
      // Arrange
      const dbError = new Error('Database error');
      mockNotificationRepository.softDelete.mockRejectedValue(dbError);
      const command = new DeleteNotificationCommand(notificationId, userId);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);
    });

    it('should pass correct userId and notificationId to repository', async () => {
      // Arrange
      const customNotificationId = 'custom-notification-456';
      const customUserId = 42;
      mockNotificationRepository.softDelete.mockResolvedValue(true);
      const command = new DeleteNotificationCommand(
        customNotificationId,
        customUserId,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(mockNotificationRepository.softDelete).toHaveBeenCalledWith(
        customNotificationId,
        customUserId,
      );
    });
  });
});

describe('DeleteNotificationCommand', () => {
  it('should create command with correct properties', () => {
    // Arrange & Act
    const command = new DeleteNotificationCommand('notification-123', 1);

    // Assert
    expect(command.id).toBe('notification-123');
    expect(command.userId).toBe(1);
  });
});
