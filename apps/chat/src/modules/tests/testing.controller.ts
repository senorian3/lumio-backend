import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiTestingHealth } from '@chat/core/decorators/swagger/testing/testing-health.decorator';

@ApiTags('Testing')
@Controller('testing')
export class TestingController {
  @Get('health')
  @ApiTestingHealth()
  healthCheck() {
    return {
      status: 'ok',
      service: 'chat',
      timestamp: new Date().toISOString(),
    };
  }
}
