import { Global, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { CoreConfig } from './core.config';

@Global()
@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: (coreConfig: CoreConfig) => ({
        autoSchemaFile: join(process.cwd(), 'apps/super-admin/src/schema.gql'),
        sortSchema: true,
        playground: coreConfig.isGraphqlPlaygroundEnabled,
        introspection: coreConfig.isGraphqlIntrospectionEnabled,
        path: 'api/v1/graphql',
        subscriptions: {
          'graphql-ws': true,
        },
        context: ({ req, res }) => ({ req, res }),
      }),
      inject: [CoreConfig],
    }),
  ],
  exports: [GraphQLModule],
})
export class GraphqlConfigModule {}
