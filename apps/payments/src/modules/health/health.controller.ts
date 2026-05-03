import { Controller, Get } from '@nestjs/common';
import { CoreConfig } from '@payments/core/core.config';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly coreConfig: CoreConfig,
  ) {}

  @Get()
  async check() {
    return this.healthService.checkAll(this.coreConfig.rmqUrl);
  }
}
