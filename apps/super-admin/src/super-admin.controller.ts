import { Controller, Get } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';

@Controller()
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get()
  getHello(): string {
    return this.superAdminService.getHello();
  }
}
