import { Controller, Get, UseGuards } from '@nestjs/common';
import { HealthService } from './health.service';
import { CoreConfig } from '@lumio/core/core.config';
import { ApiHealth } from '@lumio/core/decorators/swagger/main/health.decorator';
import { ThrottlerGuard, SkipThrottle } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard)
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly coreConfig: CoreConfig,
  ) {}

  @Get()
  @ApiHealth()
  @SkipThrottle()
  async check() {
    return await this.healthService.checkAll(this.coreConfig.rmqUrl);
  }
}
