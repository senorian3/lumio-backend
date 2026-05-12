import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { CoreConfig } from '@super-admin/core/core.config';
import { PaymentsHttpClient } from '@super-admin/core/integration/payments-http.client';
import { AppLoggerService } from '@libs/logger/logger.service';

describe('PaymentsHttpClient', () => {
  it('sends internal service identity with the API key', async () => {
    const httpService = {
      get: jest.fn().mockReturnValue(of({ data: { data: [], totalCount: 0 } })),
    } as unknown as jest.Mocked<HttpService>;
    const logger = {
      log: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<AppLoggerService>;
    const config = {
      paymentsServiceUrl: 'http://payments-service:3000',
      internalApiKey: 'super-admin-key',
      internalServiceName: 'super-admin',
    } as unknown as CoreConfig;
    const client = new PaymentsHttpClient(httpService, config, logger);

    await client.getAllPayments({ skip: 0, take: 10 });

    expect(httpService.get).toHaveBeenCalledWith(
      'http://payments-service:3000/api/v1/subscription-payments/all-payments',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-internal-service': 'super-admin',
          'x-internal-api-key': 'super-admin-key',
        }),
      }),
    );
  });
});
