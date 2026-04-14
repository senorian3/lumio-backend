import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Testing')
@Controller('testing')
export class TestingController {
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: 'chat',
      timestamp: new Date().toISOString(),
    };
  }
}
