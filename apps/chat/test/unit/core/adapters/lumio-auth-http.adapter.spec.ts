import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { of, throwError } from 'rxjs';
import { LumioAuthHttpAdapter } from '@chat/core/adapters/lumio-auth-http.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';

describe('LumioAuthHttpAdapter', () => {
  let adapter: LumioAuthHttpAdapter;
  let httpService: jest.Mocked<HttpService>;
  let logger: jest.Mocked<AppLoggerService>;

  beforeEach(() => {
    httpService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;

    logger = {
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<AppLoggerService>;

    const configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const values: Record<string, string> = {
          LUMIO_SERVICE_URL: 'http://lumio-service/api/v1',
        };
        return values[key] ?? defaultValue;
      }),
    } as unknown as ConfigService;

    adapter = new LumioAuthHttpAdapter(configService, httpService, logger);
  });

  it('returns userId when token is valid', async () => {
    httpService.get.mockReturnValue(
      of({
        data: { userId: 42 },
      } as any),
    );

    const result = await adapter.validateAccessToken('valid-token');

    expect(httpService.get).toHaveBeenCalledWith(
      'http://lumio-service/api/v1/auth/me',
      expect.objectContaining({
        headers: { Authorization: 'Bearer valid-token' },
      }),
    );
    expect(result).toEqual({ userId: 42 });
  });

  it('throws UnauthorizedException when token payload has no userId', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {},
      } as any),
    );

    await expect(
      adapter.validateAccessToken('invalid-payload-token'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when Lumio returns 401', async () => {
    const axiosError = new AxiosError(
      'Unauthorized',
      '401',
      undefined,
      undefined,
      {
        status: 401,
        data: {},
      } as any,
    );
    httpService.get.mockReturnValue(throwError(() => axiosError));

    await expect(adapter.validateAccessToken('expired-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException on network error', async () => {
    httpService.get.mockReturnValue(
      throwError(() => new Error('Network error')),
    );

    await expect(
      adapter.validateAccessToken('network-error-token'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('logs a warning when token validation fails', async () => {
    httpService.get.mockReturnValue(
      throwError(() => new Error('Network error')),
    );

    await expect(
      adapter.validateAccessToken('network-error-token'),
    ).rejects.toThrow(UnauthorizedException);

    expect(logger.warn).toHaveBeenCalled();
  });
});
