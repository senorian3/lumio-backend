import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UsersResolver } from '@super-admin/modules/users/api/users.resolver';
import { PaymentsHttpClient } from '@super-admin/core/integration/payments-http.client';
import { FilesHttpClient } from '@super-admin/core/integration/files-http.client';
import { GetUserQuery } from '@super-admin/modules/users/application/queries/get-user.query-handler';
import { GetUsersQuery } from '@super-admin/modules/users/application/queries/get-users.query-handler';
import { DeletedUserCommand } from '@super-admin/modules/users/application/commands/deleted-user.command-handler';
import { BanUserCommand } from '@super-admin/modules/users/application/commands/ban-user.command-handler';
import { UnBanUserCommand } from '@super-admin/modules/users/application/commands/unban-user.command-handler';
import { UserSortBy } from '@super-admin/core/schema/user-sort-by.enum';
import { UserBlockedFilter } from '@super-admin/core/schema/user-blocked-filter.enum';
import { PaymentSortBy } from '@super-admin/core/integration/dto/payment-sort-by.enum';
import { FileSortBy } from '@super-admin/core/integration/dto/file-sort-by.enum';
import { CoreConfig } from '@super-admin/core/core.config';
import { HttpService } from '@nestjs/axios';
import { SuperAdminJwtGuard } from '@super-admin/core/guard/jwt/super-admin-jwt.guard';
import { AppLoggerService } from '@libs/logger/logger.service';

describe('UsersResolver', () => {
  let resolver: UsersResolver;

  const mockQueryBus = {
    execute: jest.fn(),
  };

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockPaymentsHttpClient = {
    getUserPayments: jest.fn(),
  };

  const mockFilesHttpClient = {
    getUserFiles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: PaymentsHttpClient,
          useValue: mockPaymentsHttpClient,
        },
        {
          provide: FilesHttpClient,
          useValue: mockFilesHttpClient,
        },
        {
          provide: HttpService,
          useValue: { get: jest.fn() },
        },
        {
          provide: CoreConfig,
          useValue: {
            paymentsServiceUrl: 'http://localhost',
            filesServiceUrl: 'http://localhost',
            internalApiKey: 'test',
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(SuperAdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<UsersResolver>(UsersResolver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getUser', () => {
    it('should return user by id', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockQueryBus.execute.mockResolvedValue(mockUser);

      const result = await resolver.getUser(1);

      expect(result).toEqual(mockUser);
      expect(mockQueryBus.execute).toHaveBeenCalledWith(new GetUserQuery(1));
    });

    it('should return null when user not found', async () => {
      mockQueryBus.execute.mockResolvedValue(null);

      const result = await resolver.getUser(999);

      expect(result).toBeNull();
    });
  });

  describe('getUsers', () => {
    it('should return paginated users with default parameters', async () => {
      const mockResponse = {
        page: 1,
        pageSize: 10,
        totalCount: 2,
        pagesCount: 1,
        items: [
          { id: 1, username: 'user1' },
          { id: 2, username: 'user2' },
        ],
      };
      mockQueryBus.execute.mockResolvedValue(mockResponse);

      const result = await resolver.getUsers();

      expect(result).toEqual(mockResponse);
      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        new GetUsersQuery(
          1,
          10,
          undefined,
          UserSortBy.CREATED_AT_DESC,
          undefined,
        ),
      );
    });

    it('should pass custom parameters to query', async () => {
      const mockResponse = {
        page: 2,
        pageSize: 5,
        totalCount: 0,
        pagesCount: 0,
        items: [],
      };
      mockQueryBus.execute.mockResolvedValue(mockResponse);

      await resolver.getUsers(
        2,
        5,
        'john',
        UserSortBy.USERNAME_ASC,
        UserBlockedFilter.BLOCKED,
      );

      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        new GetUsersQuery(
          2,
          5,
          'john',
          UserSortBy.USERNAME_ASC,
          UserBlockedFilter.BLOCKED,
        ),
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return true', async () => {
      mockCommandBus.execute.mockResolvedValue(undefined);

      const result = await resolver.deleteUser(1);

      expect(result).toBe(true);
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new DeletedUserCommand(1),
      );
    });
  });

  describe('banUser', () => {
    it('should ban user and return true', async () => {
      mockCommandBus.execute.mockResolvedValue(undefined);

      const result = await resolver.banUser(1, 'Violation');

      expect(result).toBe(true);
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new BanUserCommand(1, 'Violation'),
      );
    });
  });

  describe('unbanUser', () => {
    it('should unban user and return true', async () => {
      mockCommandBus.execute.mockResolvedValue(undefined);

      const result = await resolver.unbanUser(1);

      expect(result).toBe(true);
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new UnBanUserCommand(1),
      );
    });
  });

  describe('payments (ResolveField)', () => {
    it('should return payments for user with profile', async () => {
      const user = { id: 1, profile: { id: 100 } };
      const mockPayments = [{ id: 1, amount: 100 }];
      mockPaymentsHttpClient.getUserPayments.mockResolvedValue(mockPayments);

      const result = await resolver.payments(
        user as any,
        1,
        20,
        PaymentSortBy.DATE_DESC,
      );

      expect(result).toEqual(mockPayments);
      expect(mockPaymentsHttpClient.getUserPayments).toHaveBeenCalledWith(
        100,
        1,
        20,
        PaymentSortBy.DATE_DESC,
      );
    });

    it('should return empty array when user has no profile', async () => {
      const user = { id: 1, profile: undefined };

      const result = await resolver.payments(
        user as any,
        1,
        20,
        PaymentSortBy.DATE_DESC,
      );

      expect(result).toEqual([]);
      expect(mockPaymentsHttpClient.getUserPayments).not.toHaveBeenCalled();
    });

    it('should return empty array when profile has no id', async () => {
      const user = { id: 1, profile: { id: undefined } };

      const result = await resolver.payments(
        user as any,
        1,
        20,
        PaymentSortBy.DATE_DESC,
      );

      expect(result).toEqual([]);
    });
  });

  describe('files (ResolveField)', () => {
    it('should return files for user', async () => {
      const user = { id: 1 };
      const mockFiles = [{ id: 1, url: 'file.jpg' }];
      mockFilesHttpClient.getUserFiles.mockResolvedValue(mockFiles);

      const result = await resolver.files(
        user as any,
        1,
        20,
        FileSortBy.DATE_DESC,
      );

      expect(result).toEqual(mockFiles);
      expect(mockFilesHttpClient.getUserFiles).toHaveBeenCalledWith(
        1,
        1,
        20,
        FileSortBy.DATE_DESC,
      );
    });
  });
});
