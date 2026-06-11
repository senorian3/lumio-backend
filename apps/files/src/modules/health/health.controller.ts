import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiCheckHealth } from '@files/core/decorators/swagger/health/check-health.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiCheckHealth()
  async check() {
    return this.healthService.checkAll();
  }
}
