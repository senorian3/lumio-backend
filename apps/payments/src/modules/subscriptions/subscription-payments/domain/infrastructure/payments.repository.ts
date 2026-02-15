import { Injectable } from '@nestjs/common';
import { PrismaService } from '@payments/prisma/prisma.service';
import { Payment } from 'generated/prisma-payments';
import { CreatePaymentDomainDto } from '../dto/create-payment.domain.dto';
import { UpdatePaymentDomainDto } from '../dto/update-payment.domain.dto';
import { PaymentStatus } from '@payments/modules/subscriptions/constants/stripe-constants';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPayment(
    data: CreatePaymentDomainDto,
    tx?: any,
  ): Promise<Payment> {
    const client = tx || this.prisma;

    return client.payment.create({
      data,
    });
  }

  async updateUrl(id: number, paymentsUrl: string): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: {
        paymentsUrl,
      },
    });
  }

  async updatePayment(
    data: UpdatePaymentDomainDto,
    tx?: any,
  ): Promise<Payment> {
    const client = tx || this.prisma;
    return client.payment.update({
      where: { customPaymentId: data.customPaymentId },
      data,
    });
  }

  async completePayment(
    customPaymentId: string,
    status: string,
    autoRenewal: boolean,
    cancelledAt: Date,
    tx?: any,
  ): Promise<Payment> {
    const client = tx || this.prisma;

    return client.payment.update({
      where: { customPaymentId },
      data: {
        status,
        autoRenewal,
        cancelledAt,
      },
    });
  }

  async findByCustomPaymentId(
    customPaymentId: string,
    tx?: any,
  ): Promise<Payment | null> {
    const client = tx || this.prisma;
    return client.payment.findFirst({
      where: { customPaymentId },
    });
  }

  async findActiveSubscriptionPaymentsWithAutoRenewalByProfileId(
    profileId: number,
  ): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: {
        profileId,
        subscriptionId: { not: null },
        autoRenewal: true,
        cancelledAt: null,
        status: 'successful',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePaymentAutoRenewal(
    subscriptionId: string,
    customPaymentId: string,
    autoRenewal: boolean,
    tx?: any,
  ): Promise<void> {
    const client = tx || this.prisma;
    await client.payment.update({
      where: { subscriptionId, customPaymentId },
      data: {
        autoRenewal,
      },
    });
  }

  async findBySubscriptionId(subscriptionId: string): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: {
        subscriptionId,
        status: 'successful',
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveSubscriptionByProfileId(
    profileId: number,
  ): Promise<Payment | null> {
    const now = new Date();

    return this.prisma.payment.findFirst({
      where: {
        profileId,
        status: 'successful',
        cancelledAt: null,
        nextPaymentDate: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePaymentUrl(
    id: number,
    paymentsUrl: string,
    tx?: any,
  ): Promise<Payment> {
    const client = tx || this.prisma;
    return client.payment.update({
      where: { id },
      data: {
        paymentsUrl,
      },
    });
  }

  async cancelPayment(
    customPaymentId: string,
    cancelledAt: Date,
    tx?: any,
  ): Promise<Payment> {
    const client = tx || this.prisma;
    return client.payment.update({
      where: { customPaymentId },
      data: {
        status: PaymentStatus.CANCELLED,
        cancelledAt: cancelledAt,
      },
    });
  }

  async deleteExpiredPendingPayments(createdBefore: Date): Promise<number> {
    const result = await this.prisma.payment.deleteMany({
      where: {
        status: 'pending',
        createdAt: { lt: createdBefore },
      },
    });
    return result.count;
  }
}
