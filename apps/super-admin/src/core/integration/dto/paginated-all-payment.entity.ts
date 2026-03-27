import { Field, Int, ObjectType } from '@nestjs/graphql';
import { PaymentOutput } from '@super-admin/core/integration/dto/all-payment.output.dto';

@ObjectType()
export class PaginatedPaymentResponse {
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
