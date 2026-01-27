import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SubscriptionPaymentTransferDto } from '@payments/modules/subscription-payments/api/dto/transfer/subscription-payment.transfer.dto';
import { PaymentsRepository } from '@payments/modules/subscription-payments/domain/infrastructure/payments.repository';
import { StripeService } from '@payments/modules/subscription-payments/adapters/stripe.service';

export class SubscriptionCommand {
  constructor(public dto: SubscriptionPaymentTransferDto) {}
}

@CommandHandler(SubscriptionCommand)
export class SubscriptionCommandHandler implements ICommandHandler<
  SubscriptionCommand,
  string
> {
  constructor(
    private paymentsRepository: PaymentsRepository,
    private stripeService: StripeService,
  ) {}

  async execute({ dto }: SubscriptionCommand): Promise<string> {
    const lastSuccessfulPayment =
      await this.paymentsRepository.findLastSuccessfulPaymentByProfileId(
        dto.profileId,
      );

    let trialEndDate: number | undefined = undefined;

    if (
      lastSuccessfulPayment &&
      lastSuccessfulPayment.nextPaymentDate &&
      lastSuccessfulPayment.nextPaymentDate > new Date()
    ) {
      trialEndDate = Math.floor(
        lastSuccessfulPayment.nextPaymentDate.getTime() / 1000,
      );
    }

    const payment = await this.paymentsRepository.createPayment({
      paymentProvider: dto.paymentProvider,
      currency: dto.currency,
      amount: dto.amount,
      profileId: dto.profileId,
    });

    const session = await this.stripeService.createPaymentSession(
      dto.subscriptionType,
      dto.amount,
      payment.id,
      dto.currency,
      trialEndDate,
    );

    await this.paymentsRepository.updatePaymentUrl(payment.id, session.url);

    return session.url;
  }
}
