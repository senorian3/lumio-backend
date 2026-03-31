import { Module } from '@nestjs/common';
import { AuthResolver } from './api/auth.resolver';

@Module({
  providers: [AuthResolver],
})
export class AuthModule {}
