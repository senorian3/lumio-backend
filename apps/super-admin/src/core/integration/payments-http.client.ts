import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CoreConfig } from '../core.config';
import { AppLoggerService } from '@libs/logger/logger.service';

import { PaymentDto } from './dto/payment.dto';
import { PaymentsResponse } from './dto/payments-response.dto';
import { PaymentSortBy } from '@super-admin/core/integration/dto/payment-sort-by.enum';
import { buildInternalApiHeaders } from '@libs/core/internal-api/internal-api';

export interface PaymentsApiResponse {
  data: any[];
  totalCount: number;
}

@Injectable()
export class PaymentsHttpClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: CoreConfig,
    private readonly logger: AppLoggerService,
  ) {}

  async getAllPayments(params: {
    profileIds?: number[];
    skip: number;
    take: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  }): Promise<PaymentsApiResponse> {
    try {
      const url = `${this.config.paymentsServiceUrl}/api/v1/subscription-payments/all-payments`;

      const queryParams: Record<string, any> = {
        skip: params.skip,
        take: params.take,
      };

      if (params.profileIds?.length) {
        queryParams['profileIds'] = params.profileIds;
      }
      if (params.sortBy) queryParams['sortBy'] = params.sortBy;
      if (params.sortOrder) queryParams['sortOrder'] = params.sortOrder;
      if (params.search) queryParams['search'] = params.search;

      const response = await firstValueFrom(
        this.httpService.get<PaymentsApiResponse>(url, {
          params: queryParams,
          paramsSerializer: {
            indexes: null,
          },
          headers: {
            'Content-Type': 'application/json',
            ...buildInternalApiHeaders(
              this.config.internalServiceName,
              this.config.internalApiKey,
            ),
          },
          timeout: 10000,
        }),
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch payments from external service: ${error?.message}`,
        PaymentsHttpClient.name,
      );

      return {
        data: [],
        totalCount: 0,
      };
    }
  }

  async getUserPayments(
    profileId: number,
    page: number = 1,
    limit: number = 20,
    sortBy: PaymentSortBy = PaymentSortBy.DATE_DESC,
  ): Promise<PaymentDto[]> {
    try {
      const url = `${this.config.paymentsServiceUrl}/api/v1/subscription-payments/profile-payments`;

      const sortByParam = this.mapSortByToApiParam(sortBy);

      const response = await firstValueFrom(
        this.httpService.get<PaymentsResponse>(url, {
          params: {
            profileId,
            page,
            limit,
            sortBy: sortByParam,
          },
          headers: {
            ...buildInternalApiHeaders(
              this.config.internalServiceName,
              this.config.internalApiKey,
            ),
          },
          timeout: 10000,
        }),
      );

      if (!response.data || !response.data.items) {
        return [];
      }

      return response.data.items.map(
        (item) =>
          new PaymentDto({
            id: item.id,
            datePayment: new Date(item.datePayment),
            endDate: new Date(item.endDate),
            amount: item.amount,
            currency: item.currency,
            paymentProvider: item.paymentProvider,
            subscriptionType: item.subscriptionType,
          }),
      );
    } catch (error: any) {
      this.logger.error(
        `Payments service error for profile ${profileId}: ${error?.message}`,
        PaymentsHttpClient.name,
      );

      return [];
    }
  }

  private mapSortByToApiParam(sortBy: PaymentSortBy): string {
    switch (sortBy) {
      case PaymentSortBy.DATE_ASC:
        return 'date_asc';
      case PaymentSortBy.USERNAME_DESC:
        return 'date_desc';
      case PaymentSortBy.AMOUNT_ASC:
        return 'amount_asc';
      case PaymentSortBy.AMOUNT_DESC:
        return 'amount_desc';
      default:
        return 'date_desc';
    }
  }
}
