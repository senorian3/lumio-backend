import { Injectable } from '@nestjs/common';
import { PrismaService } from '@payments/prisma/prisma.service';
import { Payment } from 'generated/prisma-payments';
import { CreatePaymentDomainDto } from '../dto/create-payment.domain.dto';
import { UpdatePaymentDomainDto } from '../dto/update-payment.domain.dto';

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
      where: { id: data.id },
      data,
    });
  }

  async completePayment(
    id: number,
    status: string,
    autoRenewal: boolean,
    cancelledAt: Date,
    tx?: any,
  ): Promise<Payment> {
    const client = tx || this.prisma;

    return client.payment.update({
      where: { id },
      data: {
        status,
        autoRenewal,
        cancelledAt,
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
    tx?: any,
  ): Promise<void> {
    const client = tx || this.prisma;
    await client.payment.update({
      where: { id: paymentId },
      data: {
        autoRenewal,
        cancelledAt,
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
        subscriptionId: { not: null }, // Только платежи с подпиской
      },
      orderBy: { createdAt: 'desc' }, // Самый последний
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

  async cancelPayment(id: number, tx?: any): Promise<void> {
    const client = tx || this.prisma;
    await client.payment.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });
  }
}
