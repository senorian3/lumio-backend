import { ObjectType, Field, Int } from '@nestjs/graphql';
import { PaymentOutput } from '@super-admin/modules/users/domain/schema/all-payment.output.dto';

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
