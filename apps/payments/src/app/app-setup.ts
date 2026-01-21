import { CoreConfig } from '@payments/core/core.config';
import { exceptionFilterSetup } from '@libs/settings/exception-filter.setup';
import { cookieParserSetup } from '@libs/settings/cookie-parser.setup';
import { globalPrefixSetup } from '@libs/settings/global-prefix.setup';
import { pipesSetup } from '@libs/settings/pipes.setup';
import { proxySetup } from '@libs/settings/proxy-setup';
import { validationConstraintsSetup } from '@libs/settings/validation-constraints.setup';
import { DynamicModule, INestApplication } from '@nestjs/common';
import { enableCorsSetup } from '@payments/core/settings/enable-cors.setup';

export function appSetup(
  app: INestApplication,
  coreConfig: CoreConfig,
  DynamicAppModule: DynamicModule,
) {
  enableCorsSetup(app);
  proxySetup(app);
  globalPrefixSetup(app);
  pipesSetup(app);
  validationConstraintsSetup(app, DynamicAppModule);
  exceptionFilterSetup(app, coreConfig);
  cookieParserSetup(app);
}
