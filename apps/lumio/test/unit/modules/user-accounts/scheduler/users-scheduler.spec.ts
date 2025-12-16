import { Test, TestingModule } from '@nestjs/testing';
import { UserSchedulerService } from '@lumio/modules/user-accounts/scheduler/users-scheduler';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';

describe('UserSchedulerService', () => {
  let service: UserSchedulerService;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const mockUserRepository = {
      deleteExpiredUserRegistration: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSchedulerService,
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<UserSchedulerService>(UserSchedulerService);
    userRepository = module.get(UserRepository) as jest.Mocked<UserRepository>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteExpiredUserRegistration', () => {
    it('should call deleteExpiredUserRegistration with current date', async () => {
      const date = new Date();
      await service.deleteExpiredUserRegistration();

      expect(userRepository.deleteExpiredUserRegistration).toHaveBeenCalledWith(
        date,
      );
    });

    it('should handle repository errors', async () => {
      const date = new Date();
      const error = new Error('Database error');
      userRepository.deleteExpiredUserRegistration.mockRejectedValue(error);

      await expect(service.deleteExpiredUserRegistration()).rejects.toThrow(
        error,
      );
      expect(userRepository.deleteExpiredUserRegistration).toHaveBeenCalledWith(
        date,
      );
    });
  });
});
