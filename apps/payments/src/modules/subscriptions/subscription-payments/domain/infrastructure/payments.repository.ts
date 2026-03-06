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

  async findPendingPaymentByProfileId(
    profileId: number,
  ): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: {
        profileId,
        status: PaymentStatus.PENDING,
      },
    });
  }

  async findLastSubscriptionPaymentByStripeSubscriptionId(
    stripeSubscriptionId: string,
  ): Promise<Payment | null> {
    const mainPayment = await this.prisma.payment.findFirst({
      where: {
        stripeSubscriptionId,
        status: PaymentStatus.ACTIVE,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (mainPayment) {
      return mainPayment;
    } else {
      return await this.prisma.payment.findFirst({
        where: {
          stripeSubscriptionId,
          status: PaymentStatus.EXTENSION,
          cancelledAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  async updateCustomPaymentId(
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
    cancelledAt: Date,
    tx?: any,
  ): Promise<Payment> {
    const client = tx || this.prisma;

    return client.payment.update({
      where: { customPaymentId },
      data: {
        status,
        autoRenewal: false,
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

  async updatePaymentSubscriptiAutoRenewal(
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveSubscriptionPaymentByStripeSubscriptionId(
    stripeSubscriptionId: string,
  ): Promise<Payment | null> {
    const payment = await this.prisma.payment.findFirst({
      where: {
        stripeSubscriptionId,
        cancelledAt: null,
        status: {
          in: [PaymentStatus.ACTIVE, PaymentStatus.EXTENSION],
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    return payment;
  }

  async findActiveSubscriptionPaymentByProfileId(
    profileId: number,
  ): Promise<Payment | null> {
    const now = new Date();

    return this.prisma.payment.findFirst({
      where: {
        profileId,
        status: PaymentStatus.ACTIVE,
        cancelledAt: null,
        periodEnd: { gt: now },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByProfileAndSubscriptionId(
    profileId: number,
    subscriptionId: string,
  ): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: {
        profileId,
        subscriptionId,
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
        status: PaymentStatus.PENDING,
        createdAt: { lt: createdBefore },
      },
    });
    return result.count;
  }

  async updatePaymentSubscriptionPeriodDate(
    customPaymentId: string,
    periodEnd: Date,
    tx?: any,
  ): Promise<Payment> {
    const client = tx || this.prisma;
    return client.payment.update({
      where: { customPaymentId },
      data: {
        periodEnd,
        nextPaymentDate: periodEnd,
      },
    });
  }

  async findAllUserProfilePayments(
    profileId: number,
    page: number,
    limit: number,
  ): Promise<{ payments: Payment[]; totalCount: number }> {
    const skip = (page - 1) * limit;

    const [payments, totalCount] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          profileId,
          status: {
            not: PaymentStatus.PENDING,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({
        where: {
          profileId,
          status: {
            not: PaymentStatus.PENDING,
          },
        },
      }),
    ]);

    return { payments, totalCount };
  }

  async findLastActiveSubscriptionByProfileId(
    profileId: number,
    nowDate: Date,
    customPaymentId: string,
  ): Promise<Payment | null> {
    const lastPayment = await this.prisma.payment.findFirst({
      where: {
        profileId,
        status: { not: PaymentStatus.PENDING },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastPayment || lastPayment.cancelledAt !== null) {
      return null;
    }

    return this.prisma.payment.findFirst({
      where: {
        profileId,
        status: { in: [PaymentStatus.ACTIVE, PaymentStatus.EXTENSION] },
        cancelledAt: null,
        customPaymentId: { not: customPaymentId },
        stripeSubscriptionId: { not: null },
        periodEnd: { gt: nowDate },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
