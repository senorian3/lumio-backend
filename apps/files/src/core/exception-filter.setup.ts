import { INestApplication } from '@nestjs/common';
import { CoreConfig } from '../core/core.config';
import { AllExceptionsFilter } from './exceptions/filters/all-exceptions.filter';
import { DomainExceptionsFilter } from '@libs/core/exceptions/filters/domain-exceptions.filters';

export function exceptionFilterSetup(
  app: INestApplication,
  coreConfig: CoreConfig,
) {
  app.useGlobalFilters(
    new AllExceptionsFilter(coreConfig),
    new DomainExceptionsFilter(),
  );
}
