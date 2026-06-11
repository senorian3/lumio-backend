import { PrismaService } from '@payments/prisma/prisma.service';
import { CoreConfig } from '@payments/core/core.config';
import Stripe from 'stripe';
import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiDeleteAllTestingData } from '@payments/core/decorators/swagger/testing/delete-all-testing-data.decorator';

@Controller('testing')
export class TestingController {
  private stripe: Stripe;

  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    private readonly coreConfig: CoreConfig,
  ) {
    this.stripe = new Stripe(this.coreConfig.stripeApiKey, {
      apiVersion: '2025-12-15.clover',
    });
  }

  @Delete('all-data')
  @ApiDeleteAllTestingData()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllData(): Promise<void> {
    let hasMore = true;
    while (hasMore) {
      const customers = await this.stripe.customers.list({ limit: 100 });
      for (const customer of customers.data) {
        await this.stripe.customers.del(customer.id);
      }
      hasMore = customers.has_more;
    }

    await this.prismaService.$transaction([
      this.prismaService.payment.deleteMany(),
      this.prismaService.outboxMessage.deleteMany(),
    ]);
  }
}
