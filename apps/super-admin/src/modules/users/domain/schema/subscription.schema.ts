import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Subscription {
  @Field(() => Int)
  id: number;

  @Field()
  subscriptionId: string;

  @Field()
  durationType: string;

  @Field()
  startDate: Date;

  @Field()
  endDate: Date;

  @Field()
  autoRenewal: boolean;
}
