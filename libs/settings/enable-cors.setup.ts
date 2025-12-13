import { INestApplication } from '@nestjs/common';

export function enableCorsSetup(app: INestApplication) {
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:8080',
      'http://localhost:5000',
      'https://lumio.su',
      'https://www.lumio.su',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Origin',
    ],
    exposedHeaders: [
      'Content-Disposition',
      'Content-Length',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'Retry-After',
    ],
  });
}
