import { SubscriptionPeriodUtils } from '@payments/modules/subscriptions/shared/utils/subscription-period.utils';

describe('SubscriptionPeriodUtils', () => {
  describe('calculatePeriodDuration', () => {
    it('should calculate 1 week duration', () => {
      const result = SubscriptionPeriodUtils.calculatePeriodDuration('1_week');
      expect(result).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should calculate 2 weeks duration', () => {
      const result = SubscriptionPeriodUtils.calculatePeriodDuration('2_week');
      expect(result).toBe(2 * 7 * 24 * 60 * 60 * 1000);
    });

    it('should calculate 1 month duration', () => {
      const result = SubscriptionPeriodUtils.calculatePeriodDuration('1_month');
      expect(result).toBe(30 * 24 * 60 * 60 * 1000);
    });

    it('should calculate 3 months duration', () => {
      const result = SubscriptionPeriodUtils.calculatePeriodDuration('3_month');
      expect(result).toBe(3 * 30 * 24 * 60 * 60 * 1000);
    });

    it('should calculate 1 year duration', () => {
      const result = SubscriptionPeriodUtils.calculatePeriodDuration('1_year');
      expect(result).toBe(365 * 24 * 60 * 60 * 1000);
    });

    it('should return default 30 days for unknown type', () => {
      const result = SubscriptionPeriodUtils.calculatePeriodDuration('unknown');
      expect(result).toBe(30 * 24 * 60 * 60 * 1000);
    });
  });

  describe('calculatePeriodEnd', () => {
    it('should calculate period end without extra time', () => {
      const startDate = new Date('2026-01-01T00:00:00Z');
      const result = SubscriptionPeriodUtils.calculatePeriodEnd(
        startDate,
        '1_month',
      );

      expect(result.getTime()).toBe(
        startDate.getTime() + 30 * 24 * 60 * 60 * 1000,
      );
    });

    it('should calculate period end with extra time', () => {
      const startDate = new Date('2026-01-01T00:00:00Z');
      const extraTime = 3 * 24 * 60 * 60 * 1000; // 3 days
      const result = SubscriptionPeriodUtils.calculatePeriodEnd(
        startDate,
        '1_month',
        extraTime,
      );

      expect(result.getTime()).toBe(
        startDate.getTime() + 30 * 24 * 60 * 60 * 1000 + extraTime,
      );
    });

    it('should ignore extra time when null', () => {
      const startDate = new Date('2026-01-01T00:00:00Z');
      const result = SubscriptionPeriodUtils.calculatePeriodEnd(
        startDate,
        '1_month',
        null,
      );

      expect(result.getTime()).toBe(
        startDate.getTime() + 30 * 24 * 60 * 60 * 1000,
      );
    });

    it('should ignore extra time when 0', () => {
      const startDate = new Date('2026-01-01T00:00:00Z');
      const result = SubscriptionPeriodUtils.calculatePeriodEnd(
        startDate,
        '1_month',
        0,
      );

      expect(result.getTime()).toBe(
        startDate.getTime() + 30 * 24 * 60 * 60 * 1000,
      );
    });
  });

  describe('calculateNextPaymentDate', () => {
    it('should calculate next payment date', () => {
      const currentPeriodEnd = new Date('2026-02-01T00:00:00Z');
      const result = SubscriptionPeriodUtils.calculateNextPaymentDate(
        currentPeriodEnd,
        '1_month',
      );

      expect(result.getTime()).toBe(
        currentPeriodEnd.getTime() + 30 * 24 * 60 * 60 * 1000,
      );
    });
  });

  describe('calculatePeriodDates', () => {
    it('should calculate period start and end', () => {
      const periodStart = new Date('2026-01-01T00:00:00Z');
      const result = SubscriptionPeriodUtils.calculatePeriodDates(
        periodStart,
        '1_month',
      );

      expect(result.periodStart).toBe(periodStart);
      expect(result.periodEnd.getTime()).toBe(
        periodStart.getTime() + 30 * 24 * 60 * 60 * 1000,
      );
    });

    it('should calculate period dates with extra time', () => {
      const periodStart = new Date('2026-01-01T00:00:00Z');
      const extraTime = 7 * 24 * 60 * 60 * 1000;
      const result = SubscriptionPeriodUtils.calculatePeriodDates(
        periodStart,
        '1_month',
        extraTime,
      );

      expect(result.periodEnd.getTime()).toBe(
        periodStart.getTime() + 30 * 24 * 60 * 60 * 1000 + extraTime,
      );
    });
  });
});
