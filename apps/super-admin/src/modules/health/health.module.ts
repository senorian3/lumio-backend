import { Module } from '@nestjs/common';
import { HealthResolver } from './health.resolver';
import { HealthRestController } from './health-rest.controller';
import { HealthRestService } from './health-rest.service';

@Module({
  controllers: [HealthRestController],
  providers: [HealthResolver, HealthRestService],
})
export class HealthModule {}
