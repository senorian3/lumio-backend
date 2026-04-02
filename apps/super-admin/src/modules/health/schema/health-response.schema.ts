import { ObjectType, Field } from '@nestjs/graphql';
import { DatabaseHealth } from './database-health.schema';

@ObjectType()
export class HealthResponse {
  @Field({ description: 'Общий статус сервиса' })
  status: string;

  @Field({ description: 'Временная метка проверки' })
  timestamp: Date;

  @Field({ description: 'Время работы сервиса в секундах' })
  uptime: number;

  @Field(() => DatabaseHealth, { description: 'Информация о состоянии БД' })
  database: DatabaseHealth;
}
