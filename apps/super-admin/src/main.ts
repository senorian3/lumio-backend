import { NestFactory } from '@nestjs/core';
import { SuperAdminModule } from './super-admin.module';

async function bootstrap() {
  const app = await NestFactory.create(SuperAdminModule);
  await app.listen(process.env.port ?? 3003);
}
bootstrap();
