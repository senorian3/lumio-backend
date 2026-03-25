import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PaymentDto {
  @Field(() => ID)
  id: number;

  @Field(() => Date)
  datePayment: Date;

  @Field(() => Date)
  endDate: Date;

  @Field(() => Float)
  amount: number;

  @Field()
  currency: string;

  @Field()
  paymentProvider: string;

  @Field({ nullable: true })
  subscriptionType?: string;

  constructor(data: Partial<PaymentDto>) {
    Object.assign(this, data);
  }
}
