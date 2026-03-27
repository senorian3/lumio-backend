import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class PaymentOutput {
  @Field(() => Int)
  id: number;

  @Field()
  customPaymentId: string;

  @Field(() => Int)
  profileId: number;

  @Field()
  username?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field()
  autoRenewal: boolean;

  @Field()
  paymentProvider: string;

  @Field()
  currency: string;

  @Field(() => Float)
  amount: number;

  @Field()
  status: string;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  nextPaymentDate?: Date;

  @Field()
  stripePaymentCreatedAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  @Field({ nullable: true })
  cancelledAt?: Date;

  @Field({ nullable: true })
  subscriptionId?: string;

  @Field({ nullable: true })
  mainSubscriptionId?: string;

  @Field({ nullable: true })
  stripeSubscriptionId?: string;

  @Field()
  subscriptionType: string;

  @Field({ nullable: true })
  periodStart?: Date;

  @Field({ nullable: true })
  periodEnd?: Date;

  @Field()
  paymentsUrl: string;
}
