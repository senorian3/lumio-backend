import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

export function enableCorsSetup(app: INestApplication) {
  (app as NestExpressApplication).disable('x-powered-by');

  app.use((req, res, next) => {
    const originalSetHeader = res.setHeader.bind(res);

    res.setHeader = (name: string, value: any) => {
      const headerName = name.toLowerCase();
      const blockedHeaders = [
        'x-powered-by',
        'x-ratelimit-limit',
        'x-ratelimit-remaining',
        'x-ratelimit-reset',
        'retry-after',
      ];

      if (blockedHeaders.includes(headerName)) {
        return res;
      }
      return originalSetHeader(name, value);
    };

    const originalRemoveHeader = res.removeHeader.bind(res);
    res.removeHeader = (name: string) => {
      const headerName = name.toLowerCase();
      const blockedHeaders = [
        'x-powered-by',
        'x-ratelimit-limit',
        'x-ratelimit-remaining',
        'x-ratelimit-reset',
        'retry-after',
      ];
      if (blockedHeaders.includes(headerName)) {
        return res;
      }
      return originalRemoveHeader(name);
    };

    next();
  });

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:4121',
      'https://lumio.su',
      'https://www.lumio.su',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
}
