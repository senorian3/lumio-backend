import { GetUserPaymentsParams } from '@lumio/modules/payments/api/dto/input/get-user-payments.query';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QueryPaymentsRepository } from '@lumio/modules/payments/domain/infrastructure/payments.query-repository';

export class GetUserPaymentsQuery {
  constructor(
    public readonly userId: number,
    public readonly query: GetUserPaymentsParams,
  ) {}
}

@QueryHandler(GetUserPaymentsQuery)
export class GetUserPaymentsQueryHandler implements IQueryHandler<
  GetUserPaymentsQuery,
  void
> {
  constructor(private queryPaymentsRepository: QueryPaymentsRepository) {}

  async execute(query: GetUserPaymentsQuery): Promise<void> {
    console.log(query);
  }
}
