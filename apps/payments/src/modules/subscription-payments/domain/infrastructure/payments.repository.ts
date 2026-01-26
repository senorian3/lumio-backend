import { Injectable } from '@nestjs/common';
import { PrismaService } from '@payments/prisma/prisma.service';
import { Payment } from 'generated/prisma-payments';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPayment(data: {
    paymentProvider: string;
    currency: string;
    amount: number;
    profileId: number;
  }): Promise<Payment> {
    return this.prisma.payment.create({
      data: {
        paymentProvider: data.paymentProvider,
        currency: data.currency,
        amount: data.amount,
        profileId: data.profileId,
      },
    });
  }

  async updatePaymentUrl(id: number, paymentsUrl: string): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: {
        paymentsUrl,
      },
    });
  }
  async updatePayment(
    id: number,
    status: string,
    subscriptionId?: string,
    periodStart?: Date,
    periodEnd?: Date,
    nextPaymentDate?: Date,
    subscriptionType?: string,
  ): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: {
        status,
        subscriptionId,
        periodStart,
        periodEnd,
        nextPaymentDate,
        subscriptionType,
      },
    });
  }

  async updatePaymentStatus(id: number, status: string): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: {
        status,
      },
    });
  }
}
