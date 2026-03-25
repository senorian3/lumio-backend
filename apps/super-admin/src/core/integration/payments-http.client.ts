import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CoreConfig } from '../core.config';
import { AppLoggerService } from '@libs/logger/logger.service';
import { PaymentSortBy } from '@super-admin/modules/users/domain/schema/payment-sort-by.enum';
import { PaymentsResponse } from '@super-admin/modules/users/domain/schema/payments-response.dto';
import { PaymentDto } from '@super-admin/modules/users/domain/schema/payment.dto';
import { PaymentsApiResponse } from '@super-admin/modules/users/domain/infrastructure/payments-api.client';

@Injectable()
export class PaymentsHttpClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: CoreConfig,
    private readonly logger: AppLoggerService,
  ) {}

  async getUserPayments(
    profileId: number,
    page: number = 1,
    limit: number = 20,
    sortBy: PaymentSortBy = PaymentSortBy.CREATED_AT_DESC,
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
            'x-internal-api-key': this.config.internalApiKey,
          },
          timeout: 10000,
        }),
      );

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
    } catch (error) {
      this.logger.error(
        `Payments service error for profile ${profileId}: ${error.message}`,
        PaymentsHttpClient.name,
      );
      return [];
    }
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
      const url = `${this.config.paymentsServiceUrl}/api/v1/subscription-payments/all-payments`;

      const queryParams: Record<string, any> = {
        skip: params.skip,
        take: params.take,
      };

      if (params.profileIds?.length) {
        queryParams['profileIds'] = params.profileIds;
      }

      if (params.sortBy) {
        queryParams['sortBy'] = params.sortBy;
      }

      if (params.sortOrder) {
        queryParams['sortOrder'] = params.sortOrder;
      }

      if (params.search) {
        queryParams['search'] = params.search;
      }

      this.logger.log(
        `Fetching payments from: ${url}`,
        PaymentsHttpClient.name,
      );

      const response = await firstValueFrom(
        this.httpService.get<PaymentsApiResponse>(url, {
          params: queryParams,
          paramsSerializer: {
            indexes: null,
          },
          headers: {
            'Content-Type': 'application/json',
            'x-internal-api-key': this.config.internalApiKey,
          },
          timeout: 10000,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch payments from external service: ${error.message}`,
        PaymentsHttpClient.name,
      );

      return {
        data: [],
        totalCount: 0,
      };
    }
  }

  private mapSortByToApiParam(sortBy: PaymentSortBy): string {
    switch (sortBy) {
      case PaymentSortBy.CREATED_AT_ASC:
        return 'date_asc';
      case PaymentSortBy.CREATED_AT_DESC:
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
