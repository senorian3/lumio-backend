import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { PaymentsHttpAdapter } from '@lumio/modules/payments/application/payments-http.adapter';
import {
  GetUserPaymentsQueryHandler,
  GetUserPaymentsQuery,
} from '@lumio/modules/payments/application/queries/get-user-payments.query-handler';
import { GetUserPaymentsParams } from '@lumio/modules/payments/api/dto/input/get-user-payments.query';
import { PaymentViewDto } from '@lumio/modules/payments/api/dto/output/user-payment.output.dto';

describe('GetUserPaymentsQueryHandler', () => {
  let handler: GetUserPaymentsQueryHandler;
  let mockExternalQueryUserRepository: jest.Mocked<ExternalQueryUserAccountsRepository>;
  let mockPaymentsHttpAdapter: jest.Mocked<PaymentsHttpAdapter>;

  const mockUserId = 1;
  const mockProfileId = 1;

  const mockProfile = {
    id: mockProfileId,
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-01'),
    country: 'USA',
    city: 'New York',
    aboutMe: 'Test user',
    avatarUrl: null,
    profileFilled: true,
    profileFilledAt: new Date(),
    profileUpdatedAt: new Date(),
    followersCount: 0,
    followingCount: 0,
    accountType: 'free',
    userId: mockUserId,
    user: {} as any,
  };

  const mockPayments: PaymentViewDto[] = [
    {
      amount: 100,
      currency: 'RUB',
      paymentType: 'yookassa',
      datePayment: '2024-01-01T00:00:00.000Z',
      endDate: '2024-02-01T00:00:00.000Z',
      subscriptionType: 'monthly',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserPaymentsQueryHandler,
        {
          provide: ExternalQueryUserAccountsRepository,
          useValue: {
            getProfileByUserId: jest.fn(),
          },
        },
        {
          provide: PaymentsHttpAdapter,
          useValue: {
            findAllUserProfilePayments: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetUserPaymentsQueryHandler>(
      GetUserPaymentsQueryHandler,
    );
    mockExternalQueryUserRepository = module.get(
      ExternalQueryUserAccountsRepository,
    );
    mockPaymentsHttpAdapter = module.get(PaymentsHttpAdapter);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return paginated payments successfully', async () => {
      // Arrange
      const queryParams = new GetUserPaymentsParams();
      queryParams.pageNumber = 1;
      queryParams.pageSize = 10;
      const query = new GetUserPaymentsQuery(mockUserId, queryParams);

      mockExternalQueryUserRepository.getProfileByUserId.mockResolvedValue(
        mockProfile,
      );
      mockPaymentsHttpAdapter.findAllUserProfilePayments.mockResolvedValue({
        items: [
          {
            datePayment: '2024-01-01T00:00:00.000Z',
            endDate: '2024-02-01T00:00:00.000Z',
            amount: 100,
            currency: 'RUB',
            paymentsService: 'yookassa',
            subscription: { durationType: 'monthly' },
          },
        ],
        total: 1,
      });

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(
        mockExternalQueryUserRepository.getProfileByUserId,
      ).toHaveBeenCalledWith(mockUserId);
      expect(
        mockPaymentsHttpAdapter.findAllUserProfilePayments,
      ).toHaveBeenCalledWith(
        expect.stringContaining('/subscription-payments/profile-payments'),
        mockProfileId,
        queryParams.pageNumber,
        queryParams.pageSize,
      );
      expect(result.items).toEqual(mockPayments);
      expect(result.totalCount).toBe(1);
    });

    it('should throw NotFoundDomainException when profile not found', async () => {
      // Arrange
      const queryParams = new GetUserPaymentsParams();
      queryParams.pageNumber = 1;
      queryParams.pageSize = 10;
      const query = new GetUserPaymentsQuery(mockUserId, queryParams);

      mockExternalQueryUserRepository.getProfileByUserId.mockResolvedValue(
        null,
      );

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        NotFoundDomainException,
      );

      try {
        await handler.execute(query);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Not Found');
        expect(error.extensions[0]?.message).toBe('Profile not found');
        expect(error.extensions[0]?.field).toBe('profile');
      }
    });

    it('should return empty result when no payments found', async () => {
      // Arrange
      const queryParams = new GetUserPaymentsParams();
      queryParams.pageNumber = 1;
      queryParams.pageSize = 10;
      const query = new GetUserPaymentsQuery(mockUserId, queryParams);

      mockExternalQueryUserRepository.getProfileByUserId.mockResolvedValue(
        mockProfile,
      );
      mockPaymentsHttpAdapter.findAllUserProfilePayments.mockResolvedValue({
        items: [],
        total: 0,
      });

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('should handle database error when finding profile', async () => {
      // Arrange
      const queryParams = new GetUserPaymentsParams();
      queryParams.pageNumber = 1;
      queryParams.pageSize = 10;
      const query = new GetUserPaymentsQuery(mockUserId, queryParams);
      const dbError = new Error('Database connection failed');

      mockExternalQueryUserRepository.getProfileByUserId.mockRejectedValue(
        dbError,
      );

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);
    });

    it('should handle error when finding payments', async () => {
      // Arrange
      const queryParams = new GetUserPaymentsParams();
      queryParams.pageNumber = 1;
      queryParams.pageSize = 10;
      const query = new GetUserPaymentsQuery(mockUserId, queryParams);
      const httpError = new Error('HTTP connection failed');

      mockExternalQueryUserRepository.getProfileByUserId.mockResolvedValue(
        mockProfile,
      );
      mockPaymentsHttpAdapter.findAllUserProfilePayments.mockRejectedValue(
        httpError,
      );

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(httpError);
    });
  });
});
