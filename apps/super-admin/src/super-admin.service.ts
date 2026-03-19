import { Injectable } from '@nestjs/common';

@Injectable()
export class SuperAdminService {
  getHello(): string {
    return 'Hello World!';
  }
}
