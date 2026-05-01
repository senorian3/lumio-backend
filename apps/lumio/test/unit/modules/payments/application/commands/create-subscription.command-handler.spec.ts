import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { PaymentsHttpAdapter } from '@lumio/modules/payments/application/payments-http.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { InputCreateSubscriptionPaymentDto } from '@lumio/modules/payments/api/dto/input/subscription-create.input.dto';
import { SubscriptionType } from '@libs/core/types/subscription-type';
import {
  CreateSubscriptionPaymentUrlCommandHandler,
  CreateSubscriptionPaymentUrlCommand,
} from '@lumio/modules/payments/application/commands/create-subscription.command-handler';

describe('CreateSubscriptionPaymentUrlCommandHandler', () => {
  let handler: CreateSubscriptionPaymentUrlCommandHandler;
  let mockExternalQueryUserRepository: jest.Mocked<ExternalQueryUserAccountsRepository>;
  let mockPaymentsHttpAdapter: jest.Mocked<PaymentsHttpAdapter>;

  const mockUserId = 1;
  const mockProfileId = 1;

  const mockDto = new InputCreateSubscriptionPaymentDto();
  mockDto.profileId = '1';
  mockDto.currency = 'RUB';
  mockDto.subscriptionType = SubscriptionType.ONE_MONTH;
  mockDto.paymentProvider = 'yookassa';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSubscriptionPaymentUrlCommandHandler,
        {
          provide: ExternalQueryUserAccountsRepository,
          useValue: {
            getProfileIdByUserId: jest.fn(),
          },
        },
        {
          provide: PaymentsHttpAdapter,
          useValue: {
            createPaymentUrl: jest.fn(),
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<CreateSubscriptionPaymentUrlCommandHandler>(
      CreateSubscriptionPaymentUrlCommandHandler,
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
    it('should return payment url successfully', async () => {
      // Arrange
      const command = new CreateSubscriptionPaymentUrlCommand(
        mockUserId,
        mockDto,
      );
      const mockPaymentUrl = 'https://payment.example.com/pay/123';

      mockExternalQueryUserRepository.getProfileIdByUserId.mockResolvedValue(
        mockProfileId,
      );
      mockPaymentsHttpAdapter.createPaymentUrl.mockResolvedValue({
        url: mockPaymentUrl,
      });

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(
        mockExternalQueryUserRepository.getProfileIdByUserId,
      ).toHaveBeenCalledWith(mockUserId);
      expect(mockPaymentsHttpAdapter.createPaymentUrl).toHaveBeenCalled();
      expect(result).toBe(mockPaymentUrl);
    });

    it('should pass localhostOrigin to payments http adapter', async () => {
      // Arrange
      const localhostOrigin = 'http://localhost:3000';
      const command = new CreateSubscriptionPaymentUrlCommand(
        mockUserId,
        mockDto,
        localhostOrigin,
      );
      const mockPaymentUrl = 'https://payment.example.com/pay/123';

      mockExternalQueryUserRepository.getProfileIdByUserId.mockResolvedValue(
        mockProfileId,
      );
      mockPaymentsHttpAdapter.createPaymentUrl.mockResolvedValue({
        url: mockPaymentUrl,
      });

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(mockPaymentsHttpAdapter.createPaymentUrl).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          localhostOrigin: localhostOrigin,
        }),
      );
      expect(result).toBe(mockPaymentUrl);
    });

    it('should throw BadRequestDomainException when profile does not exist', async () => {
      // Arrange
      const command = new CreateSubscriptionPaymentUrlCommand(
        mockUserId,
        mockDto,
      );

      mockExternalQueryUserRepository.getProfileIdByUserId.mockResolvedValue(
        null,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );

      try {
        await handler.execute(command);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Bad Request');
        expect(error.extensions[0]?.message).toBe('Profile does not exist');
        expect(error.extensions[0]?.field).toBe('userId');
      }
    });

    it('should throw error when payment adapter fails', async () => {
      // Arrange
      const command = new CreateSubscriptionPaymentUrlCommand(
        mockUserId,
        mockDto,
      );
      const paymentError = new Error('Payment service unavailable');

      mockExternalQueryUserRepository.getProfileIdByUserId.mockResolvedValue(
        mockProfileId,
      );
      mockPaymentsHttpAdapter.createPaymentUrl.mockRejectedValue(paymentError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(paymentError);
    });

    it('should handle database error when finding profile', async () => {
      // Arrange
      const command = new CreateSubscriptionPaymentUrlCommand(
        mockUserId,
        mockDto,
      );
      const dbError = new Error('Database connection failed');

      mockExternalQueryUserRepository.getProfileIdByUserId.mockRejectedValue(
        dbError,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);
    });
  });
});
