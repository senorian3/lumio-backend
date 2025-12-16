import { INestApplication } from '@nestjs/common';
import { CoreConfig } from '../core/core.config';
import { DomainExceptionsFilter } from '@libs/core/exceptions/filters/domain-exceptions.filters';
import { AllExceptionsFilter } from '@lumio/core/exceptions/filters/all-exceptions.filter';

// export function exceptionFilterSetup(
//   app: INestApplication,
//   coreConfig: CoreConfig,
// ) {
//   app.useGlobalFilters(
//     new AllExceptionsFilter(coreConfig),
//     new DomainExceptionsFilter(),
//   );
// }
