import { Controller, Get } from '@nestjs/common';
import { ApiHealth } from '@chat/core/decorators/swagger/main/health.decorator';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiHealth()
  async check() {
    return this.healthService.checkAll();
  }
}
