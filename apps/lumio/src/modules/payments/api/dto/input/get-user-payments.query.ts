import { BaseSortablePaginationParams } from '@libs/core/dto/pagination/base.query-params.input-dto';
import { IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export enum PaymentsSortBy {
  CREATED_AT = 'createdAt',
}

export class GetUserPaymentsParams extends BaseSortablePaginationParams<PaymentsSortBy> {
  @IsOptional()
  @IsEnum(PaymentsSortBy)
  @Transform(({ value }) => {
    if (!value) return PaymentsSortBy.CREATED_AT;
    const upperValue = value.toString().toUpperCase();
    return (
      Object.values(PaymentsSortBy).find(
        (v) =>
          v.toUpperCase() === upperValue ||
          v.replace('_', '').toUpperCase() === upperValue,
      ) || PaymentsSortBy.CREATED_AT
    );
  })
  sortBy: PaymentsSortBy = PaymentsSortBy.CREATED_AT;
}
