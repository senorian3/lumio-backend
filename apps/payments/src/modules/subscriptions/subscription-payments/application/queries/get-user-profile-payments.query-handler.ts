import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { UserProfilePaymentResponseDto } from '@payments/modules/subscriptions/subscription-payments/api/dto/user-profile-payment.response.dto';

export class GetUserProfilePaymentsQuery {
  constructor(
    public readonly profileId: number,
    public readonly page: number,
    public readonly limit: number,
    public readonly sortBy: string = 'date_desc',
  ) {}
}

@QueryHandler(GetUserProfilePaymentsQuery)
export class GetUserProfilePaymentsQueryHandler implements IQueryHandler<GetUserProfilePaymentsQuery> {
  constructor(private readonly paymentsRepository: PaymentsRepository) {}

  async execute(query: GetUserProfilePaymentsQuery) {
    const { payments, totalCount } =
      await this.paymentsRepository.findAllUserProfilePayments(
        query.profileId,
        query.page,
        query.limit,
        query.sortBy,
      );

    const items = UserProfilePaymentResponseDto.mapManyToView(payments);

    return {
      items,
      totalCount,
    };
  }
}
