import { Global, Module } from '@nestjs/common';
import { AppLoggerService } from '@libs/logger/logger.service';

@Global()
@Module({
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class LoggerModule {}
