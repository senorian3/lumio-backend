import { INestApplication } from '@nestjs/common';

export function enableCorsSetup(app: INestApplication) {
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://lumio.su',
      'https://www.lumio.su',
      'https://files.lumio.su',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: [
      'Content-Disposition',
      'Content-Length',
      'X-Total-Count',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
  });
}
