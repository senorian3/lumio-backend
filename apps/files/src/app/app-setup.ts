import { CoreConfig } from '@files/core/core.config';
import { exceptionFilterSetup } from '@files/core/exception-filter.setup';
import { enableCorsSetup } from '@files/core/settings/enable-cors.setup';
import { swaggerSetup } from '@files/core/settings/swagger.setup';
import { cookieParserSetup } from '@libs/settings/cookie-parser.setup';
import { globalPrefixSetup } from '@libs/settings/global-prefix.setup';
import { jsonLimitSetup } from '@libs/settings/json-limit.setup';
import { pipesSetup } from '@libs/settings/pipes.setup';
import { proxySetup } from '@libs/settings/proxy-setup';
import { validationConstraintsSetup } from '@libs/settings/validation-constraints.setup';
import { DynamicModule, INestApplication } from '@nestjs/common';

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
  swaggerSetup(app, coreConfig.isSwaggerEnabled, coreConfig.port);
}
