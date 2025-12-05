import { DynamicModule, INestApplication } from '@nestjs/common';
import { pipesSetup } from '@libs/settings/pipes.setup';
import { cookieParserSetup } from '@libs/settings/cookie-parser.setup';
import { enableCorsSetup } from '@libs/settings/enable-cors.setup';
import { globalPrefixSetup } from '@libs/settings/glolbal-prefix.setup';
import { proxySetup } from '@libs/settings/proxy-setup';
import { swaggerSetup } from '@libs/settings/swagger.setup';
import { validationConstraintsSetup } from '@libs/settings/validation-constraints.setup';
import { CoreConfig } from '../core/core.config';
import { exceptionFilterSetup } from '../core/exception-filter.setup';

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
