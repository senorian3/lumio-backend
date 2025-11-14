import { DynamicModule, INestApplication } from '@nestjs/common';
import { pipesSetup } from 'apps/libs/settings/pipes.setup';
import { cookieParserSetup } from 'apps/libs/settings/cookie-parser.setup';
import { enableCorsSetup } from 'apps/libs/settings/enable-cors.setup';
import { globalPrefixSetup } from 'apps/libs/settings/glolbal-prefix.setup';
import { proxySetup } from 'apps/libs/settings/proxy-setup';
import { swaggerSetup } from 'apps/libs/settings/swagger.setup';
import { validationConstraintsSetup } from 'apps/libs/settings/validation-constraints.setup';
import { CoreConfig } from './core/core.config';
import { exceptionFilterSetup } from './core/exception-filter.setup';

export function appSetup(
  app: INestApplication,
  coreConfig: CoreConfig,
  DynamicAppModule: DynamicModule,
) {
  pipesSetup(app);
  globalPrefixSetup(app);
  proxySetup(app);
  swaggerSetup(app, coreConfig.isSwaggerEnabled);
  enableCorsSetup(app);
  validationConstraintsSetup(app, DynamicAppModule);
  exceptionFilterSetup(app, coreConfig);
  cookieParserSetup(app);
}
