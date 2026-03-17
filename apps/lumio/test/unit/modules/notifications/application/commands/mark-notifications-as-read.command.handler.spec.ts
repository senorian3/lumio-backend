import { Test, TestingModule } from '@nestjs/testing';
import {
  MarkNotificationsAsReadCommand,
  MarkNotificationsAsReadCommandHandler,
} from '@lumio/modules/notifications/application/commands/mark-notifications-as-read.command.handler';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.repository';

describe('MarkNotificationsAsReadCommandHandler', () => {
  let handler: MarkNotificationsAsReadCommandHandler;
  let mockNotificationRepository: jest.Mocked<NotificationRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarkNotificationsAsReadCommandHandler,
        {
          provide: NotificationRepository,
          useValue: {
            markNotificationsAsRead: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<MarkNotificationsAsReadCommandHandler>(
      MarkNotificationsAsReadCommandHandler,
    );
    mockNotificationRepository = module.get(NotificationRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const userId = 1;
    const notificationIds = [
      'notification-1',
      'notification-2',
      'notification-3',
    ];

    it('should mark notifications as read successfully', async () => {
      // Arrange
      mockNotificationRepository.markNotificationsAsRead.mockResolvedValue(
        undefined,
      );
      const command = new MarkNotificationsAsReadCommand(
        userId,
        notificationIds,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(
        mockNotificationRepository.markNotificationsAsRead,
      ).toHaveBeenCalledWith(userId, notificationIds);
    });

    it('should pass correct userId and notificationIds to repository', async () => {
      // Arrange
      const customUserId = 42;
      const customNotificationIds = ['custom-1', 'custom-2'];
      mockNotificationRepository.markNotificationsAsRead.mockResolvedValue(
        undefined,
      );
      const command = new MarkNotificationsAsReadCommand(
        customUserId,
        customNotificationIds,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(
        mockNotificationRepository.markNotificationsAsRead,
      ).toHaveBeenCalledWith(customUserId, customNotificationIds);
    });

    it('should handle single notification', async () => {
      // Arrange
      const singleNotificationId = ['single-notification'];
      mockNotificationRepository.markNotificationsAsRead.mockResolvedValue(
        undefined,
      );
      const command = new MarkNotificationsAsReadCommand(
        userId,
        singleNotificationId,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(
        mockNotificationRepository.markNotificationsAsRead,
      ).toHaveBeenCalledWith(userId, singleNotificationId);
    });

    it('should handle empty notification ids array', async () => {
      // Arrange
      const emptyNotificationIds: string[] = [];
      mockNotificationRepository.markNotificationsAsRead.mockResolvedValue(
        undefined,
      );
      const command = new MarkNotificationsAsReadCommand(
        userId,
        emptyNotificationIds,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(
        mockNotificationRepository.markNotificationsAsRead,
      ).toHaveBeenCalledWith(userId, emptyNotificationIds);
    });

    it('should propagate database errors', async () => {
      // Arrange
      const dbError = new Error('Database error');
      mockNotificationRepository.markNotificationsAsRead.mockRejectedValue(
        dbError,
      );
      const command = new MarkNotificationsAsReadCommand(
        userId,
        notificationIds,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);
    });

    it('should not throw when marking non-existent notifications', async () => {
      // Arrange
      const nonExistentIds = ['non-existent-1', 'non-existent-2'];
      mockNotificationRepository.markNotificationsAsRead.mockResolvedValue(
        undefined,
      );
      const command = new MarkNotificationsAsReadCommand(
        userId,
        nonExistentIds,
      );

      // Act & Assert
      await expect(handler.execute(command)).resolves.not.toThrow();
    });
  });
});

describe('MarkNotificationsAsReadCommand', () => {
  it('should create command with correct properties', () => {
    // Arrange & Act
    const notificationIds = ['notification-1', 'notification-2'];
    const command = new MarkNotificationsAsReadCommand(1, notificationIds);

    // Assert
    expect(command.userId).toBe(1);
    expect(command.notificationIds).toEqual(notificationIds);
  });

  it('should store reference to notification ids array', () => {
    // Arrange
    const notificationIds = ['notification-1'];

    // Act
    const command = new MarkNotificationsAsReadCommand(1, notificationIds);

    // Assert
    expect(command.notificationIds).toBe(notificationIds);
  });
});
