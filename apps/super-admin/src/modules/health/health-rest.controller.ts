import { Controller, Get } from '@nestjs/common';
import { HealthRestService } from './health-rest.service';

@Controller('health')
export class HealthRestController {
  constructor(private readonly healthService: HealthRestService) {}

  @Get()
  async check() {
    return this.healthService.checkAll();
  }
}
