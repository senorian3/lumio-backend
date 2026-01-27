import { SubscriptionPaymentTransferDto } from '@libs/dto/transfer/subscription-payment.transfer.dto';
import { AppLoggerService } from '@libs/logger/logger.service';
import { CoreConfig } from '@lumio/core/core.config';
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PaymentsHttpAdapter {
  constructor(
    private readonly coreConfig: CoreConfig,
    private readonly loggerService: AppLoggerService,
  ) {}

  private getHeaders(additionalHeaders?: Record<string, string>) {
    return {
      'X-Internal-API-Key': this.coreConfig.internalApiKey,
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };
  }

  async createPaymentUrl<T>(
    endpoint: string,
    dto: SubscriptionPaymentTransferDto,
    additionalHeaders?: Record<string, string>,
  ): Promise<T> {
    const url = `${this.coreConfig.filesFrontendUrl}/${endpoint}`;
    const headers = this.getHeaders(additionalHeaders);

    try {
      const response = await axios.post<T>(url, dto, { headers });
      return response.data;
    } catch (error) {
      this.loggerService.error(
        `Failed to GET from ${url}:`,
        error?.stack,
        PaymentsHttpAdapter.name,
      );
      throw error;
    }
  }
}
