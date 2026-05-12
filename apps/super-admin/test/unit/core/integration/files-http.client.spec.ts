import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { CoreConfig } from '@super-admin/core/core.config';
import { FilesHttpClient } from '@super-admin/core/integration/files-http.client';
import { AppLoggerService } from '@libs/logger/logger.service';

describe('FilesHttpClient', () => {
  it('sends internal service identity with the API key', async () => {
    const httpService = {
      get: jest.fn().mockReturnValue(of({ data: { items: [] } })),
    } as unknown as jest.Mocked<HttpService>;
    const logger = {
      error: jest.fn(),
    } as unknown as jest.Mocked<AppLoggerService>;
    const config = {
      filesServiceUrl: 'http://files-service:3000',
      internalApiKey: 'super-admin-key',
      internalServiceName: 'super-admin',
    } as unknown as CoreConfig;
    const client = new FilesHttpClient(httpService, config, logger);

    await client.getUserFiles(10);

    expect(httpService.get).toHaveBeenCalledWith(
      'http://files-service:3000/api/v1/files/user/10/files',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-internal-service': 'super-admin',
          'x-internal-api-key': 'super-admin-key',
        }),
      }),
    );
  });
});
