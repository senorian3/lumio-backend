import { HttpService } from '@nestjs/axios';
import { HealthMonitoringScheduler } from '@lumio/modules/features/health-monitoring/health-monitoring.scheduler';
import { CoreConfig } from '@lumio/core/core.config';
import { AppLoggerService } from '@libs/logger/logger.service';

describe('HealthMonitoringScheduler', () => {
  let scheduler: HealthMonitoringScheduler;
  let httpService: { axiosRef: jest.Mock };
  let logger: jest.Mocked<Pick<AppLoggerService, 'warn' | 'error'>>;

  beforeEach(() => {
    httpService = {
      axiosRef: jest.fn(),
    };
    logger = {
      warn: jest.fn(),
      error: jest.fn(),
    };

    scheduler = new HealthMonitoringScheduler(
      httpService as unknown as HttpService,
      {
        filesServiceUrl: 'http://files:3001',
        paymentsServiceUrl: 'http://payments:3002',
        superAdminServiceUrl: 'http://super-admin:3003',
        chatServiceUrl: 'http://chat:3004',
      } as unknown as CoreConfig,
      logger as unknown as AppLoggerService,
    );
  });

  it('pings health endpoints for every external service', async () => {
    httpService.axiosRef.mockResolvedValue({ status: 200 });

    await scheduler.pingExternalServicesHealth();

    expect(httpService.axiosRef).toHaveBeenCalledTimes(4);
    expect(httpService.axiosRef).toHaveBeenCalledWith({
      method: 'GET',
      url: 'http://files:3001/api/v1/health',
      timeout: 5000,
    });
    expect(httpService.axiosRef).toHaveBeenCalledWith({
      method: 'GET',
      url: 'http://payments:3002/api/v1/health',
      timeout: 5000,
    });
    expect(httpService.axiosRef).toHaveBeenCalledWith({
      method: 'GET',
      url: 'http://super-admin:3003/api/v1/health',
      timeout: 5000,
    });
    expect(httpService.axiosRef).toHaveBeenCalledWith({
      method: 'GET',
      url: 'http://chat:3004/api/v1/health',
      timeout: 5000,
    });
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs a warning when a service returns a non-2xx status', async () => {
    httpService.axiosRef.mockResolvedValueOnce({ status: 503 });
    httpService.axiosRef.mockResolvedValue({ status: 200 });

    await scheduler.pingExternalServicesHealth();

    expect(logger.warn).toHaveBeenCalledWith(
      'files health check returned status 503',
      'HealthMonitoringScheduler',
    );
  });

  it('logs a warning when a service reports degraded health with 2xx status', async () => {
    httpService.axiosRef.mockResolvedValueOnce({
      status: 200,
      data: { status: 'degraded' },
    });
    httpService.axiosRef.mockResolvedValue({
      status: 200,
      data: { status: 'ok' },
    });

    await scheduler.pingExternalServicesHealth();

    expect(logger.warn).toHaveBeenCalledWith(
      'files health check reported status degraded',
      'HealthMonitoringScheduler',
    );
  });

  it('logs an error when a service health request fails', async () => {
    httpService.axiosRef.mockRejectedValueOnce(
      new Error('connect ECONNREFUSED'),
    );
    httpService.axiosRef.mockResolvedValue({ status: 200 });

    await scheduler.pingExternalServicesHealth();

    expect(logger.error).toHaveBeenCalledWith(
      'files health check failed: connect ECONNREFUSED',
      expect.any(String),
      'HealthMonitoringScheduler',
    );
  });
});
