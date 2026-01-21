import { INestApplication } from '@nestjs/common';
import { ExceptionFilterConfig } from '@libs/core/exceptions/filters/all-exceptions.filter';
import { DomainExceptionsFilter } from '@libs/core/exceptions/filters/domain-exceptions.filters';
import { AllExceptionsFilter } from '@libs/core/exceptions/filters/all-exceptions.filter';

export function exceptionFilterSetup(
  app: INestApplication,
  config: ExceptionFilterConfig,
) {
  app.useGlobalFilters(
    new AllExceptionsFilter(config),
    new DomainExceptionsFilter(),
  );
}
