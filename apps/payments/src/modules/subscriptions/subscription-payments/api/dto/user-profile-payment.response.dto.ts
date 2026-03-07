import { plainToInstance } from 'class-transformer';
import { Payment } from 'generated/prisma-payments';

export class UserProfilePaymentResponseDto {
  datePayment: string;
  endDate: string;
  amount: number;
  currency: string;
  paymentType: string;
  subscriptionType: string | null;

  static mapToView(payment: Payment): UserProfilePaymentResponseDto {
    return plainToInstance(UserProfilePaymentResponseDto, {
      datePayment: payment.stripePaymentCreatedAt.toISOString(),
      endDate:
        payment.periodEnd?.toISOString() || payment.createdAt.toISOString(),
      amount: Number(payment.amount),
      currency: payment.currency,
      paymentType: payment.paymentProvider,
      subscriptionType: payment.subscriptionType || null,
    });
  }

  static mapManyToView(payments: Payment[]): UserProfilePaymentResponseDto[] {
    return payments.map((payment) => this.mapToView(payment));
  }
}
