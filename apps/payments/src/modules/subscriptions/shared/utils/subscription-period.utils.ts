export class SubscriptionPeriodUtils {
  static calculatePeriodDuration(subscriptionType: string): number {
    if (subscriptionType.includes('week')) {
      const weekCount = subscriptionType.includes('2') ? 2 : 1;
      return weekCount * 7 * 24 * 60 * 60 * 1000;
    } else if (subscriptionType.includes('month')) {
      const monthCount = subscriptionType.includes('3') ? 3 : 1;
      return monthCount * 30 * 24 * 60 * 60 * 1000;
    } else if (subscriptionType.includes('year')) {
      return 365 * 24 * 60 * 60 * 1000;
    } else {
      return 30 * 24 * 60 * 60 * 1000;
    }
  }

  static calculatePeriodEnd(
    startDate: Date,
    subscriptionType: string,
    extraTime?: number | null,
  ): Date {
    let duration = this.calculatePeriodDuration(subscriptionType);

    if (extraTime && extraTime > 0) {
      duration += extraTime;
    }

    return new Date(startDate.getTime() + duration);
  }

  static calculateNextPaymentDate(
    currentPeriodEnd: Date,
    subscriptionType: string,
  ): Date {
    const duration = this.calculatePeriodDuration(subscriptionType);
    return new Date(currentPeriodEnd.getTime() + duration);
  }

  static calculatePeriodDates(
    periodStart: Date,
    subscriptionType: string,
    extraTime?: number | null,
  ): { periodStart: Date; periodEnd: Date } {
    const periodEnd = this.calculatePeriodEnd(
      periodStart,
      subscriptionType,
      extraTime,
    );
    return { periodStart, periodEnd };
  }
}
