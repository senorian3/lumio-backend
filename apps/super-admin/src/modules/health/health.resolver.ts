import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class HealthResolver {
  @Query(() => String, { description: 'Health check endpoint' })
  health(): string {
    return 'Super Admin service is healthy';
  }

  @Query(() => String, { description: 'Get service version' })
  version(): string {
    return '1.0.0';
  }
}
