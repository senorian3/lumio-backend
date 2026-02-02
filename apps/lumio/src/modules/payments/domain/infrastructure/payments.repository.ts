import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { Payments } from 'generated/prisma-lumio';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPaymentById(paymentId: number): Promise<Payments | null> {
    return this.prisma.payments.findUnique({
      where: { id: paymentId },
    });
  }

  async findPaymentBySubscriptionId(
    subscriptionId: number,
  ): Promise<Payments | null> {
    return this.prisma.payments.findFirst({
      where: { subscription: { id: subscriptionId } },
    });
  }

  async createPayment(
    data: {
      amount: number;
      paymentsService?: string;
      userProfileId: number;
    },
    tx?: any,
  ): Promise<Payments> {
    const client = tx || this.prisma;
    return client.payments.create({
      data: {
        amount: data.amount,
        paymentsService: data.paymentsService,
        userProfileId: data.userProfileId,
      },
    });
  }
}
