import { plainToInstance } from 'class-transformer';

export class PaymentViewDto {
  datePayment: string;
  endDate: string;
  amount: number;
  currency: string;
  paymentType: string;
  subscriptionType: string | null;

  static mapToView(payment: any): PaymentViewDto {
    return plainToInstance(PaymentViewDto, {
      datePayment: payment.datePayment,
      endDate: payment.endDate,
      amount: Number(payment.amount),
      currency: payment.currency,
      paymentType: payment.paymentsService,
      subscriptionType: payment.subscription?.durationType || null,
    });
  }

  static mapManyToView(payments: any[]): PaymentViewDto[] {
    return payments.map((payment) => this.mapToView(payment));
  }
}
