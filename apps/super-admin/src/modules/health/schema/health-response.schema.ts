import { ObjectType, Field } from '@nestjs/graphql';
import { DatabaseHealth } from './database-health.schema';

@ObjectType()
export class HealthResponse {
  @Field()
  status: string;

  @Field()
  timestamp: Date;

  @Field()
  uptime: number;

  @Field(() => DatabaseHealth)
  database: DatabaseHealth;
}
