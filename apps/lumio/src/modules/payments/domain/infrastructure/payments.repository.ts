import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { Payments } from 'generated/prisma-lumio';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPaymentById(paymentId: string): Promise<Payments | null> {
    return this.prisma.payments.findUnique({
      where: { id: paymentId },
    });
  }

  async findPaymentBySubscriptionId(id: string): Promise<Payments | null> {
    return this.prisma.payments.findFirst({
      where: { subscription: { id } },
    });
  }

  async createPayment(
    data: {
      id: string;
      amount: number;
      currency: string;
      paymentsService: string;
      subscriptionId: string;
      datePayment: Date;
      endDate: Date;
    },
    tx?: any,
  ): Promise<Payments> {
    const client = tx || this.prisma;

    return client.payments.create({
      data: {
        id: data.id,
        amount: data.amount,
        currency: data.currency,
        paymentsService: data.paymentsService,
        subscription: { connect: { id: data.subscriptionId } },
        datePayment: data.datePayment,
        endDate: data.endDate,
      },
    });
  }
}
