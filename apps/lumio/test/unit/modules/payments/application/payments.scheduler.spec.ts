import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsScheduler } from '@lumio/modules/payments/application/payments.scheduler';
import { AppLoggerService } from '@libs/logger/logger.service';
import { NotificationsService } from '@lumio/modules/notifications/application/notifications.service';
import { SubscriptionRepository } from '@lumio/modules/payments/domain/infrastructure/subscription.repository';

describe('PaymentsScheduler', () => {
  let scheduler: PaymentsScheduler;
  let logger: jest.Mocked<AppLoggerService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let subscriptionRepository: jest.Mocked<SubscriptionRepository>;

  const mockSubscription = {
    id: 1,
    subscriptionId: 'sub_123',
    durationType: '1 month',
    startDate: new Date('2026-02-18T09:17:35.000Z'),
    endDate: new Date('2026-03-18T09:17:35.000Z'),
    autoRenewal: true,
    userProfileId: 1,
    userProfile: {
      userId: 1,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsScheduler,
        {
          provide: AppLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            createPaymentWarningNotification: jest.fn(),
            createSubscriptionExpiring7DaysNotification: jest.fn(),
            createSubscriptionExpiring1DayNotification: jest.fn(),
          },
        },
        {
          provide: SubscriptionRepository,
          useValue: {
            findSubscriptionsExpiring: jest.fn(),
          },
        },
      ],
    }).compile();

    scheduler = module.get<PaymentsScheduler>(PaymentsScheduler);
    logger = module.get(AppLoggerService);
    notificationsService = module.get(NotificationsService);
    subscriptionRepository = module.get(SubscriptionRepository);
  });

  describe('checkUpcomingPayments', () => {
    it('should send payment warning notifications for subscriptions expiring in 24 hours', async () => {
      subscriptionRepository.findSubscriptionsExpiring.mockResolvedValue([
        mockSubscription,
      ]);

      await scheduler.checkUpcomingPayments();

      expect(
        subscriptionRepository.findSubscriptionsExpiring,
      ).toHaveBeenCalledWith(24, true, 'hours');
      expect(
        notificationsService.createPaymentWarningNotification,
      ).toHaveBeenCalledWith(1, mockSubscription.endDate);
    });

    it('should silently return when no subscriptions are expiring', async () => {
      subscriptionRepository.findSubscriptionsExpiring.mockResolvedValue([]);

      await scheduler.checkUpcomingPayments();

      expect(
        notificationsService.createPaymentWarningNotification,
      ).not.toHaveBeenCalled();
    });

    it('should handle errors for individual subscriptions and continue', async () => {
      const mockSubscription2 = {
        ...mockSubscription,
        userProfile: { userId: 2 },
      };
      subscriptionRepository.findSubscriptionsExpiring.mockResolvedValue([
        mockSubscription,
        mockSubscription2,
      ]);
      notificationsService.createPaymentWarningNotification
        .mockRejectedValueOnce(new Error('Notification failed'))
        .mockResolvedValueOnce(undefined);

      await scheduler.checkUpcomingPayments();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error sending payment warning notification'),
        expect.any(String),
        'PaymentsScheduler',
      );
      expect(
        notificationsService.createPaymentWarningNotification,
      ).toHaveBeenCalledTimes(2);
    });

    it('should throw when repository fails', async () => {
      subscriptionRepository.findSubscriptionsExpiring.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(scheduler.checkUpcomingPayments()).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('checkSubscriptionsExpiring', () => {
    it('should send 7-day and 1-day expiration notifications', async () => {
      subscriptionRepository.findSubscriptionsExpiring
        .mockResolvedValueOnce([mockSubscription])
        .mockResolvedValueOnce([mockSubscription]);

      await scheduler.checkSubscriptionsExpiring();

      expect(
        subscriptionRepository.findSubscriptionsExpiring,
      ).toHaveBeenNthCalledWith(1, 7, false, 'days');
      expect(
        subscriptionRepository.findSubscriptionsExpiring,
      ).toHaveBeenNthCalledWith(2, 1, false, 'days');
      expect(
        notificationsService.createSubscriptionExpiring7DaysNotification,
      ).toHaveBeenCalledWith(1, mockSubscription.endDate);
      expect(
        notificationsService.createSubscriptionExpiring1DayNotification,
      ).toHaveBeenCalledWith(1, mockSubscription.endDate);
    });

    it('should handle empty results for 7-day subscriptions', async () => {
      subscriptionRepository.findSubscriptionsExpiring
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockSubscription]);

      await scheduler.checkSubscriptionsExpiring();

      expect(
        notificationsService.createSubscriptionExpiring7DaysNotification,
      ).not.toHaveBeenCalled();
      expect(
        notificationsService.createSubscriptionExpiring1DayNotification,
      ).toHaveBeenCalledWith(1, mockSubscription.endDate);
    });

    it('should handle errors for individual 7-day notifications and continue', async () => {
      const mockSubscription2 = {
        ...mockSubscription,
        userProfile: { userId: 2 },
      };
      subscriptionRepository.findSubscriptionsExpiring
        .mockResolvedValueOnce([mockSubscription, mockSubscription2])
        .mockResolvedValueOnce([]);
      notificationsService.createSubscriptionExpiring7DaysNotification
        .mockRejectedValueOnce(new Error('Notification failed'))
        .mockResolvedValueOnce(undefined);

      await scheduler.checkSubscriptionsExpiring();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error sending 7-day expiration notification'),
        expect.any(String),
        'PaymentsScheduler',
      );
    });

    it('should handle errors for individual 1-day notifications and continue', async () => {
      const mockSubscription2 = {
        ...mockSubscription,
        userProfile: { userId: 2 },
      };
      subscriptionRepository.findSubscriptionsExpiring
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockSubscription, mockSubscription2]);
      notificationsService.createSubscriptionExpiring1DayNotification
        .mockRejectedValueOnce(new Error('Notification failed'))
        .mockResolvedValueOnce(undefined);

      await scheduler.checkSubscriptionsExpiring();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error sending 1-day expiration notification'),
        expect.any(String),
        'PaymentsScheduler',
      );
    });

    it('should handle repository errors gracefully', async () => {
      subscriptionRepository.findSubscriptionsExpiring.mockRejectedValue(
        new Error('Database error'),
      );

      await scheduler.checkSubscriptionsExpiring();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Error in checkSubscriptionsExpiring scheduler',
        ),
        expect.any(String),
        'PaymentsScheduler',
      );
    });
  });
});
