import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsRepository } from '@payments/modules/subscription-payments/domain/infrastructure/payments.repository';
import { StripeService } from '@payments/modules/subscription-payments/adapters/stripe.service';

export class StripeHookCommand {
  constructor(
    public readonly signature: string,
    public readonly rawBody: Buffer,
  ) {}
}

@CommandHandler(StripeHookCommand)
export class StripeHookCommandHandler implements ICommandHandler<
  StripeHookCommand,
  void
> {
  constructor(
    private paymentsRepository: PaymentsRepository,
    private stripeService: StripeService,
  ) {}

  async execute(command: StripeHookCommand): Promise<void> {
    const event = await this.stripeService.verify(
      command.rawBody,
      command.signature,
    );

    console.log(event);
  }
}
