import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { AppLoggerService } from '@libs/logger/logger.service';
import { CoreConfig } from '@lumio/core/core.config';

type MonitoredService = {
  name: string;
  url: string;
};

@Injectable()
export class HealthMonitoringScheduler {
  private static readonly REQUEST_TIMEOUT_MS = 5000;

  constructor(
    private readonly httpService: HttpService,
    private readonly coreConfig: CoreConfig,
    private readonly logger: AppLoggerService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async pingExternalServicesHealth(): Promise<void> {
    await Promise.all(
      this.getMonitoredServices().map((service) => this.pingService(service)),
    );
  }

  private getMonitoredServices(): MonitoredService[] {
    return [
      { name: 'files', url: this.coreConfig.filesServiceUrl },
      { name: 'payments', url: this.coreConfig.paymentsServiceUrl },
      { name: 'super-admin', url: this.coreConfig.superAdminServiceUrl },
      { name: 'chat', url: this.coreConfig.chatServiceUrl },
    ];
  }

  private async pingService(service: MonitoredService): Promise<void> {
    try {
      const response = await this.httpService.axiosRef({
        method: 'GET',
        url: this.buildHealthUrl(service.url),
        timeout: HealthMonitoringScheduler.REQUEST_TIMEOUT_MS,
      });

      if (response.status < 200 || response.status >= 300) {
        this.logger.warn(
          `${service.name} health check returned status ${response.status}`,
          HealthMonitoringScheduler.name,
        );
        return;
      }

      if (response.data?.status && response.data.status !== 'ok') {
        this.logger.warn(
          `${service.name} health check reported status ${response.data.status}`,
          HealthMonitoringScheduler.name,
        );
      }
    } catch (error) {
      this.logger.error(
        `${service.name} health check failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
        HealthMonitoringScheduler.name,
      );
    }
  }

  private buildHealthUrl(serviceUrl: string): string {
    const normalizedUrl = serviceUrl.replace(/\/+$/, '');

    if (normalizedUrl.endsWith('/api/v1')) {
      return `${normalizedUrl}/health`;
    }

    return `${normalizedUrl}/api/v1/health`;
  }
}
