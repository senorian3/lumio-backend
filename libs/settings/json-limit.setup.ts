import { INestApplication } from '@nestjs/common';
import { json } from 'express';

export function jsonLimitSetup(app: INestApplication) {
  app.use(json({ limit: '20mb' }));
}
