import { INestApplication, ValidationPipe } from '@nestjs/common';
import { CoreConfig } from '@chat/core/core.config';
import { enableCorsSetup } from '@chat/core/settings/enable-cors.setup';
import { swaggerSetup } from '@chat/core/settings/swagger.setup';

export function appSetup(app: INestApplication, coreConfig: CoreConfig): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  enableCorsSetup(app);

  if (coreConfig.isSwaggerEnabled) {
    swaggerSetup(app, coreConfig.isSwaggerEnabled);
  }
}
