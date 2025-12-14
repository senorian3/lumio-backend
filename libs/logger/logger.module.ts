import { Module } from '@nestjs/common';
import { AppLoggerService } from '@libs/logger/logger.service';

@Module({
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class LoggerModule {}
