import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HealthMonitoringScheduler } from './health-monitoring.scheduler';

@Module({
  imports: [HttpModule],
  providers: [HealthMonitoringScheduler],
})
export class HealthMonitoringModule {}
