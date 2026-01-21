import { DynamicModule, INestApplication } from '@nestjs/common';
import { pipesSetup } from '@libs/settings/pipes.setup';
import { cookieParserSetup } from '@libs/settings/cookie-parser.setup';
import { globalPrefixSetup } from '@libs/settings/global-prefix.setup';
import { proxySetup } from '@libs/settings/proxy-setup';
import { swaggerSetup } from '@lumio/core/settings/swagger.setup';
import { validationConstraintsSetup } from '@libs/settings/validation-constraints.setup';
import { CoreConfig } from '../core/core.config';
import { exceptionFilterSetup } from '@libs/settings/exception-filter.setup';
import { enableCorsSetup } from '@lumio/core/settings/enable-cors.setup';
import { jsonLimitSetup } from '@libs/settings/json-limit.setup';

export function appSetup(
  app: INestApplication,
  coreConfig: CoreConfig,
  DynamicAppModule: DynamicModule,
) {
  enableCorsSetup(app);
  proxySetup(app);
  globalPrefixSetup(app);
  pipesSetup(app);
  jsonLimitSetup(app);
  validationConstraintsSetup(app, DynamicAppModule);
  exceptionFilterSetup(app, coreConfig);
  cookieParserSetup(app);
  swaggerSetup(app, coreConfig.isSwaggerEnabled);
}
