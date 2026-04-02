import { Query, Resolver } from '@nestjs/graphql';
import { HealthResponse } from './schema/health-response.schema';

@Resolver()
export class HealthResolver {
  @Query(() => HealthResponse, { description: 'Health check endpoint' })
  health(): HealthResponse {
    return {
      status: 'OK',
      timestamp: new Date(),
      uptime: process.uptime(),
      database: {
        status: 'CONNECTED',
        responseTime: 0,
      },
    };
  }

  @Query(() => String, { description: 'Get service version' })
  version(): string {
    return '1.0.0';
  }
}
