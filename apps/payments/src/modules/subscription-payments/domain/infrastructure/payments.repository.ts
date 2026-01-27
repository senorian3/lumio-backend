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
    autoRenewal?: boolean,
    cancelledAt?: Date | null,
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
        autoRenewal,
        cancelledAt,
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

  async findPaymentById(id: number): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { id },
    });
  }

  async findActiveSubscriptionsWithAutoRenewalByProfileId(
    profileId: number,
  ): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: {
        profileId,
        subscriptionId: { not: null },
        autoRenewal: true,
        cancelledAt: null,
        status: 'successful',
        OR: [
          { nextPaymentDate: null },
          { nextPaymentDate: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePaymentAutoRenewal(
    paymentId: number,
    autoRenewal: boolean,
    cancelledAt: Date | null,
  ): Promise<void> {
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        autoRenewal,
        cancelledAt,
      },
    });
  }

  async findPaymentBySubscriptionId(
    subscriptionId: string,
  ): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: {
        subscriptionId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLastSuccessfulPaymentByProfileId(
    profileId: number,
  ): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: {
        profileId,
        status: 'successful',
        subscriptionId: { not: null }, // Только платежи с подпиской
      },
      orderBy: { createdAt: 'desc' }, // Самый последний
    });
  }
}
