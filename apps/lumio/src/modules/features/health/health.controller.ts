import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { CoreConfig } from '@lumio/core/core.config';

@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly coreConfig: CoreConfig,
  ) {}

  @Get()
  async check() {
    return await this.healthService.checkAll(this.coreConfig.rmqUrl);
  }
}
