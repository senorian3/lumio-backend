import { INestApplication } from '@nestjs/common';

export function enableCorsSetup(app: INestApplication) {
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
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Internal-API-Key',
    ],
  });
}
