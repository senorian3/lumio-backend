import { Test, TestingModule } from '@nestjs/testing';
import {
  GetUserHandler,
  GetUserQuery,
} from '@super-admin/modules/users/application/queries/get-user.query-handler';
import { UserQueryRepository } from '@super-admin/modules/users/domain/infrastructure/user.query-repository';
import { AppLoggerService } from '@libs/logger/logger.service';

describe('GetUserHandler', () => {
  let handler: GetUserHandler;

  const mockUserQueryRepository = {
    findById: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserHandler,
        {
          provide: UserQueryRepository,
          useValue: mockUserQueryRepository,
        },
        {
          provide: AppLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    handler = module.get<GetUserHandler>(GetUserHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return user when found', async () => {
      const query = new GetUserQuery(1);
      const mockUserDto = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01'),
        isBlocked: false,
        profile: undefined,
      };

      mockUserQueryRepository.findById.mockResolvedValue(mockUserDto);

      const result = await handler.execute(query);

      expect(result).toBeDefined();
      expect(result!.id).toBe(1);
      expect(result!.username).toBe('testuser');
      expect(mockUserQueryRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when user not found', async () => {
      const query = new GetUserQuery(999);

      mockUserQueryRepository.findById.mockResolvedValue(null);

      const result = await handler.execute(query);

      expect(result).toBeNull();
      expect(mockUserQueryRepository.findById).toHaveBeenCalledWith(999);
    });

    it('should return null and log error when exception occurs', async () => {
      const query = new GetUserQuery(1);
      const mockError = new Error('Database error');

      mockUserQueryRepository.findById.mockRejectedValue(mockError);

      const result = await handler.execute(query);

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get user by id: 1',
        mockError.stack,
        GetUserHandler.name,
      );
    });

    it('should map user profile when present', async () => {
      const query = new GetUserQuery(1);
      const mockUserDto = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01'),
        isBlocked: false,
        profile: {
          id: 100,
          firstName: 'John',
          lastName: 'Doe',
          accountType: 'PERSONAL',
        },
      };

      mockUserQueryRepository.findById.mockResolvedValue(mockUserDto);

      const result = await handler.execute(query);

      expect(result).toBeDefined();
      expect(result!.profile).toBeDefined();
      expect(result!.profile!.id).toBe(100);
      expect(result!.profile!.firstName).toBe('John');
    });
  });
});
