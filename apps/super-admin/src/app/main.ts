import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { initAppModule } from './init-app-module';
import { appSetup } from './app-setup';
import { CoreConfig } from '@super-admin/core/core.config';

async function bootstrap() {
  const DynamicAppModule = await initAppModule();
  const app = await NestFactory.create(DynamicAppModule);

  const coreConfig = app.get<CoreConfig>(CoreConfig);

  appSetup(app, coreConfig, DynamicAppModule);

  const port = coreConfig.port;

  await app.listen(port, () => {
    Logger.log(`Super Admin starting listen port: ${port}`, 'Bootstrap');
    Logger.log(`NODE_ENV: ${coreConfig.env}`, 'Bootstrap');
    Logger.log(
      `GraphQL Playground: http://localhost:${port}/graphql`,
      'Bootstrap',
    );
  });
}
bootstrap();
