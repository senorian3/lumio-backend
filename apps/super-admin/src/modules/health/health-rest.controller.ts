import { Controller, Get } from '@nestjs/common';
import { ApiHealth } from '@super-admin/core/decorators/swagger/health/health.decorator';
import { HealthRestService } from './health-rest.service';

@Controller('health')
export class HealthRestController {
  constructor(private readonly healthService: HealthRestService) {}

  @Get()
  @ApiHealth()
  async check() {
    return this.healthService.checkAll();
  }
}
