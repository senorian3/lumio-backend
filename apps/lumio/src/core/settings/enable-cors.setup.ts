import { INestApplication } from '@nestjs/common';

export function enableCorsSetup(app: INestApplication) {
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:4121',
      'https://lumio.su',
      'http://dev.lumio.su',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200,
  });
}
