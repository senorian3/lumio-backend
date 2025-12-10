import { INestApplication } from '@nestjs/common';

export function proxySetup(app: INestApplication) {
  const httpAdapter = app.getHttpAdapter();

  if (httpAdapter?.getInstance) {
    const expressInstance = httpAdapter.getInstance();
    expressInstance.set('trust proxy', true);
  }
}
