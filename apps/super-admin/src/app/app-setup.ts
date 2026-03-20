import { DynamicModule, INestApplication } from '@nestjs/common';
import { pipesSetup } from '@libs/settings/pipes.setup';
import { cookieParserSetup } from '@libs/settings/cookie-parser.setup';
import { globalPrefixSetup } from '@libs/settings/global-prefix.setup';
import { proxySetup } from '@libs/settings/proxy-setup';
import { validationConstraintsSetup } from '@libs/settings/validation-constraints.setup';
import { CoreConfig } from '@super-admin/core/core.config';
import { enableCorsSetup } from '@super-admin/core/settings/enable-cors.setup';

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
  cookieParserSetup(app);
}
