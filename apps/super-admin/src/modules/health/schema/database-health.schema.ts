import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class DatabaseHealth {
  @Field()
  status: string;

  @Field()
  responseTime: number;
}
