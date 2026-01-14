import { Module } from '@nestjs/common';
import { HttpService } from './http.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [LoggerModule],
  providers: [HttpService],
  exports: [HttpService],
})
export class SharedModule {}
