import { DynamicModule, INestApplication } from '@nestjs/common';
import { CoreConfig } from '@chat/core/core.config';
import { enableCorsSetup } from '@chat/core/settings/enable-cors.setup';
import { swaggerSetup } from '@chat/core/settings/swagger.setup';
import { pipesSetup } from '@libs/settings/pipes.setup';
import { exceptionFilterSetup } from '@libs/settings/exception-filter.setup';
import { globalPrefixSetup } from '@libs/settings/global-prefix.setup';
import { proxySetup } from '@libs/settings/proxy-setup';
import { validationConstraintsSetup } from '@libs/settings/validation-constraints.setup';
import { cookieParserSetup } from '@libs/settings/cookie-parser.setup';

export function appSetup(
  app: INestApplication,
  coreConfig: CoreConfig,
  DynamicAppModule: DynamicModule,
): void {
  enableCorsSetup(app);
  proxySetup(app);
  globalPrefixSetup(app);
  pipesSetup(app);
  validationConstraintsSetup(app, DynamicAppModule);
  cookieParserSetup(app);
  exceptionFilterSetup(app, coreConfig);
  swaggerSetup(app, coreConfig.isSwaggerEnabled);
}
