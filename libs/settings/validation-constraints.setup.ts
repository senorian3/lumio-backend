import { DynamicModule, INestApplication } from '@nestjs/common';
import { useContainer } from 'class-validator';

export function validationConstraintsSetup(
  app: INestApplication,
  DynamicAppModule: DynamicModule,
) {
  const appContext = app.select(DynamicAppModule);

  useContainer(appContext, {
    fallbackOnErrors: true,
  });
}
