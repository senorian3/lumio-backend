import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QueryPaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/ayments.query-repository';

export class GetAllPaymentsQuery {
  constructor(
    public readonly profileIds?: number[],
    public readonly skip: number = 0,
    public readonly take: number = 10,
    public readonly sortBy: string = 'createdAt',
    public readonly sortOrder: 'asc' | 'desc' = 'desc',
    public readonly search?: string,
  ) {}
}

@QueryHandler(GetAllPaymentsQuery)
export class GetAllPaymentsHandler implements IQueryHandler<GetAllPaymentsQuery> {
  constructor(
    private readonly queryPaymentsRepository: QueryPaymentsRepository,
  ) {}

  async execute(query: GetAllPaymentsQuery) {
    return this.queryPaymentsRepository.findAllPayments(
      query.profileIds,
      query.skip,
      query.take,
      query.sortBy,
      query.sortOrder,
      query.search,
    );
  }
}
