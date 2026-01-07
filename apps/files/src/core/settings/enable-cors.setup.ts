import { INestApplication } from '@nestjs/common';

export function enableCorsSetup(app: INestApplication) {
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:4122',
      'https://lumio.su',
      'https://www.lumio.su',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Content-Range',
      'Range',
      'X-File-Name',
      'X-File-Size',
      'X-Internal-API-Key',
    ],
    exposedHeaders: [
      'Content-Disposition',
      'Content-Length',
      'X-File-Name',
      'X-File-Size',
      'ETag',
    ],
  });
}
