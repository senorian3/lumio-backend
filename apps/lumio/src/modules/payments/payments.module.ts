import { Module } from '@nestjs/common';
import { PaymentsController } from './api/payments.controller';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { CreateSubscriptionPaymentUrlCommandHandler } from './application/commands/create-subscription.command-handler';
import { LoggerModule } from '@libs/logger/logger.module';
import { PaymentsHttpAdapter } from './application/payments-http.adapter';

const useCases = [CreateSubscriptionPaymentUrlCommandHandler];

const adapters = [PaymentsHttpAdapter];

const repository = [];

const queryRepository = [];

@Module({
  imports: [UserAccountsModule, LoggerModule],
  controllers: [PaymentsController],
  providers: [...useCases, ...adapters, ...repository, ...queryRepository],
})
export class PaymentsModule {}
