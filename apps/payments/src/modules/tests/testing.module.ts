import { Module } from '@nestjs/common';
import { TestingController } from './testing.controller';
import { StripeAdapter } from '../subscriptions/subscription-payments/application/stripe.adapter';
import { CoreConfig } from '@payments/core/core.config';

@Module({
  imports: [],
  controllers: [TestingController],
  providers: [StripeAdapter, CoreConfig],
})
export class TestingModule {}
