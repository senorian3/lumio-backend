import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CoreModule } from '../core.module';
import { PaymentsHttpClient } from './payments-http.client';
import { FilesHttpClient } from './files-http.client';
import { LoggerModule } from '@libs/logger/logger.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    CoreModule,
    LoggerModule,
  ],
  providers: [PaymentsHttpClient, FilesHttpClient],
  exports: [PaymentsHttpClient, FilesHttpClient],
})
export class IntegrationModule {}
