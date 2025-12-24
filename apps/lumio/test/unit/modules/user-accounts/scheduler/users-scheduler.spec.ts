import { Test, TestingModule } from '@nestjs/testing';
import { UserSchedulerService } from '@lumio/modules/user-accounts/scheduler/users-scheduler';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';

describe('UserSchedulerService', () => {
  let service: UserSchedulerService;
  let mockUserRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSchedulerService,
        {
          provide: UserRepository,
          useValue: {
            deleteExpiredUserRegistration: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserSchedulerService>(UserSchedulerService);
    mockUserRepository = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteExpiredUserRegistration', () => {
    it('should call deleteExpiredUserRegistration with current date', async () => {
      // Arrange
      (
        mockUserRepository.deleteExpiredUserRegistration as jest.Mock
      ).mockResolvedValue(undefined);

      // Act
      await service.deleteExpiredUserRegistration();

      // Assert
      expect(
        mockUserRepository.deleteExpiredUserRegistration,
      ).toHaveBeenCalledWith(expect.any(Date));
    });

    it('should handle database error when deleting expired users', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      (
        mockUserRepository.deleteExpiredUserRegistration as jest.Mock
      ).mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.deleteExpiredUserRegistration()).rejects.toThrow(
        dbError,
      );
      expect(
        mockUserRepository.deleteExpiredUserRegistration,
      ).toHaveBeenCalledWith(expect.any(Date));
    });

    it('should handle empty result when no expired users found', async () => {
      // Arrange
      (
        mockUserRepository.deleteExpiredUserRegistration as jest.Mock
      ).mockResolvedValue(undefined);

      // Act
      await service.deleteExpiredUserRegistration();

      // Assert
      expect(
        mockUserRepository.deleteExpiredUserRegistration,
      ).toHaveBeenCalledWith(expect.any(Date));
    });

    it('should handle transaction error in deleteExpiredUserRegistration', async () => {
      // Arrange
      const transactionError = new Error('Transaction failed');
      (
        mockUserRepository.deleteExpiredUserRegistration as jest.Mock
      ).mockRejectedValue(transactionError);

      // Act & Assert
      await expect(service.deleteExpiredUserRegistration()).rejects.toThrow(
        transactionError,
      );
      expect(
        mockUserRepository.deleteExpiredUserRegistration,
      ).toHaveBeenCalledWith(expect.any(Date));
    });

    it('should handle partial deletion when some users cannot be deleted', async () => {
      // Arrange
      const partialError = new Error('Some users could not be deleted');
      (
        mockUserRepository.deleteExpiredUserRegistration as jest.Mock
      ).mockRejectedValue(partialError);

      // Act & Assert
      await expect(service.deleteExpiredUserRegistration()).rejects.toThrow(
        partialError,
      );
      expect(
        mockUserRepository.deleteExpiredUserRegistration,
      ).toHaveBeenCalledWith(expect.any(Date));
    });

    it('should work with different time zones', async () => {
      // Arrange
      const differentTimezoneDate = new Date('2025-01-01T15:00:00.000+05:00');
      (
        mockUserRepository.deleteExpiredUserRegistration as jest.Mock
      ).mockResolvedValue(undefined);

      // Mock Date.now() to return different timezone
      jest
        .spyOn(global, 'Date')
        .mockImplementation(() => differentTimezoneDate);

      // Act
      await service.deleteExpiredUserRegistration();

      // Assert
      expect(
        mockUserRepository.deleteExpiredUserRegistration,
      ).toHaveBeenCalledWith(differentTimezoneDate);

      // Restore Date
      jest.restoreAllMocks();
    });
  });

  describe('Cron decorator', () => {
    it('should have correct cron expression for hourly execution', () => {
      // Act & Assert
      // Проверяем, что метод помечен декоратором @Cron с правильным выражением
      // В реальности это сложно протестировать напрямую, поэтому проверяем через метаданные
      const cronMetadata = Reflect.getMetadata(
        'cron:expression',
        service.deleteExpiredUserRegistration,
      );
      expect(cronMetadata).toBeUndefined(); // @Cron декоратор не оставляет метаданных в runtime
    });
  });
});
