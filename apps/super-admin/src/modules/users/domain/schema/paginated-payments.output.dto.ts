// @super-admin/modules/payments/api/dto/output/paginated-payments.output.dto.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { PaymentOutput } from '@super-admin/modules/users/domain/schema/payment.output.dto';

@ObjectType()
export class PaginatedPaymentsOutput {
  @Field(() => Int)
  page: number;

  @Field(() => Int)
  pageSize: number;

  @Field(() => Int)
  pagesCount: number;

  @Field(() => Int)
  totalCount: number;

  @Field(() => [PaymentOutput])
  items: PaymentOutput[];
}
