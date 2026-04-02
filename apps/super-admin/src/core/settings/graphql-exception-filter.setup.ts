import { INestApplication } from '@nestjs/common';
import { GraphQLExceptionFilter } from '../filters/graphql-exception.filter';

export function graphqlExceptionFilterSetup(app: INestApplication) {
  app.useGlobalFilters(new GraphQLExceptionFilter());
}
