import { NestFactory } from '@nestjs/core';
import { CoreConfig } from './core/core.config';
import { initAppModule } from './init-app-module';
import { appSetup } from './settings';

async function bootstrap() {
  const DynamicAppModule = await initAppModule();

  const app = await NestFactory.create(DynamicAppModule);

  const coreConfig = app.get<CoreConfig>(CoreConfig);

  appSetup(app, coreConfig, DynamicAppModule);

  const port = coreConfig.port;

  await app.listen(port, () => {
    console.log('App starting listen port: ', port);
    console.log('NODE_ENV: ', coreConfig.env);
  });
}
bootstrap();
