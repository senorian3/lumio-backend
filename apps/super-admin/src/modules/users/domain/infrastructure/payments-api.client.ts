// @super-admin/modules/payments/domain/infrastructure/payments-api.client.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AppLoggerService } from '@libs/logger/logger.service';
import { CoreConfig } from '@super-admin/core/core.config';

export interface PaymentsApiResponse {
  data: any[];
  totalCount: number;
}

@Injectable()
export class PaymentsApiClient {
  private readonly baseUrl: string;
  private readonly internalApiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly logger: AppLoggerService,
    private readonly coreConfig: CoreConfig, // <-- Внедряем CoreConfig
  ) {
    this.baseUrl = process.env.PAYMENTS_SERVICE_URL || 'http://localhost:3001';
    this.internalApiKey = this.coreConfig.internalApiKey; // <-- Используем из конфига
  }

  async getAllPayments(params: {
    profileIds?: number[];
    skip: number;
    take: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  }): Promise<PaymentsApiResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params.profileIds?.length) {
        params.profileIds.forEach((id) =>
          queryParams.append('profileIds', id.toString()),
        );
      }

      queryParams.append('skip', params.skip.toString());
      queryParams.append('take', params.take.toString());

      if (params.sortBy) {
        queryParams.append('sortBy', params.sortBy);
      }

      if (params.sortOrder) {
        queryParams.append('sortOrder', params.sortOrder);
      }

      if (params.search) {
        queryParams.append('search', params.search);
      }

      const url = `${this.baseUrl}/api/v1/subscription-payments/all-payments?${queryParams.toString()}`;

      this.logger.log(`Fetching payments from: ${url}`, 'PaymentsApiClient');

      const response = await firstValueFrom(
        this.httpService.get<PaymentsApiResponse>(url, {
          headers: {
            'Content-Type': 'application/json',
            // 🔑 Заголовок для InternalApiGuard
            'x-api-key': this.internalApiKey,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch payments from external service`,
        error?.message,
        'PaymentsApiClient',
      );

      // Возвращаем пустой результат вместо выбрасывания ошибки
      return {
        data: [],
        totalCount: 0,
      };
    }
  }
}
