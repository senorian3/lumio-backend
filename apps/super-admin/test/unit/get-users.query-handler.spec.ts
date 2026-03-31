import { Test, TestingModule } from '@nestjs/testing';
import {
  GetUsersHandler,
  GetUsersQuery,
} from '@super-admin/modules/users/application/queries/get-users.query-handler';
import { UserQueryRepository } from '@super-admin/modules/users/domain/infrastructure/user.query-repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { UserSortBy } from '@super-admin/core/schema/user-sort-by.enum';
import { UserBlockedFilter } from '@super-admin/core/schema/user-blocked-filter.enum';

describe('GetUsersHandler', () => {
  let handler: GetUsersHandler;

  const mockUserQueryRepository = {
    findMany: jest.fn(),
    count: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUsersHandler,
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

    handler = module.get<GetUsersHandler>(GetUsersHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return paginated users successfully', async () => {
      const query = new GetUsersQuery(
        1,
        10,
        undefined,
        UserSortBy.CREATED_AT_DESC,
        undefined,
      );
      const mockUsers = [
        {
          id: 1,
          username: 'user1',
          email: 'user1@test.com',
          createdAt: new Date(),
          isBlocked: false,
        },
        {
          id: 2,
          username: 'user2',
          email: 'user2@test.com',
          createdAt: new Date(),
          isBlocked: false,
        },
      ];

      mockUserQueryRepository.findMany.mockResolvedValue(mockUsers);
      mockUserQueryRepository.count.mockResolvedValue(2);

      const result = await handler.execute(query);

      expect(result).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalCount).toBe(2);
      expect(result.pagesCount).toBe(1);
      expect(result.items).toHaveLength(2);
      expect(mockUserQueryRepository.findMany).toHaveBeenCalled();
      expect(mockUserQueryRepository.count).toHaveBeenCalled();
    });

    it('should return empty result when no users found', async () => {
      const query = new GetUsersQuery(
        1,
        10,
        undefined,
        UserSortBy.CREATED_AT_DESC,
        undefined,
      );

      mockUserQueryRepository.findMany.mockResolvedValue([]);
      mockUserQueryRepository.count.mockResolvedValue(0);

      const result = await handler.execute(query);

      expect(result).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalCount).toBe(0);
      expect(result.pagesCount).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    it('should calculate pages count correctly', async () => {
      const query = new GetUsersQuery(
        1,
        5,
        undefined,
        UserSortBy.CREATED_AT_DESC,
        undefined,
      );

      mockUserQueryRepository.findMany.mockResolvedValue([]);
      mockUserQueryRepository.count.mockResolvedValue(23);

      const result = await handler.execute(query);

      expect(result.pagesCount).toBe(5); // ceil(23/5) = 5
    });

    it('should handle search parameter', async () => {
      const query = new GetUsersQuery(
        1,
        10,
        'john',
        UserSortBy.CREATED_AT_DESC,
        undefined,
      );

      mockUserQueryRepository.findMany.mockResolvedValue([]);
      mockUserQueryRepository.count.mockResolvedValue(0);

      await handler.execute(query);

      expect(mockUserQueryRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'john',
        }),
      );
    });

    it('should handle blocked filter', async () => {
      const query = new GetUsersQuery(
        1,
        10,
        undefined,
        UserSortBy.CREATED_AT_DESC,
        UserBlockedFilter.BLOCKED,
      );

      mockUserQueryRepository.findMany.mockResolvedValue([]);
      mockUserQueryRepository.count.mockResolvedValue(0);

      await handler.execute(query);

      expect(mockUserQueryRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          blockedFilter: UserBlockedFilter.BLOCKED,
        }),
      );
    });

    it('should handle ASC sort order', async () => {
      const query = new GetUsersQuery(
        1,
        10,
        undefined,
        UserSortBy.USERNAME_ASC,
        undefined,
      );

      mockUserQueryRepository.findMany.mockResolvedValue([]);
      mockUserQueryRepository.count.mockResolvedValue(0);

      await handler.execute(query);

      expect(mockUserQueryRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: 'asc',
        }),
      );
    });

    it('should handle DESC sort order', async () => {
      const query = new GetUsersQuery(
        1,
        10,
        undefined,
        UserSortBy.CREATED_AT_DESC,
        undefined,
      );

      mockUserQueryRepository.findMany.mockResolvedValue([]);
      mockUserQueryRepository.count.mockResolvedValue(0);

      await handler.execute(query);

      expect(mockUserQueryRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: 'desc',
        }),
      );
    });

    it('should return empty result and log error when exception occurs', async () => {
      const query = new GetUsersQuery(
        1,
        10,
        undefined,
        UserSortBy.CREATED_AT_DESC,
        undefined,
      );
      const mockError = new Error('Database error');

      mockUserQueryRepository.findMany.mockRejectedValue(mockError);

      const result = await handler.execute(query);

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should calculate skip correctly for pagination', async () => {
      const query = new GetUsersQuery(
        3,
        10,
        undefined,
        UserSortBy.CREATED_AT_DESC,
        undefined,
      );

      mockUserQueryRepository.findMany.mockResolvedValue([]);
      mockUserQueryRepository.count.mockResolvedValue(0);

      await handler.execute(query);

      expect(mockUserQueryRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3-1) * 10 = 20
          take: 10,
        }),
      );
    });
  });
});
