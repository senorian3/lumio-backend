import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UnauthorizedDomainException } from '@libs/core/exceptions/domain-exceptions';
import { CoreConfig } from '@payments/core/core.config';
import { Reflector } from '@nestjs/core';
import {
  INTERNAL_ALLOWED_SERVICES_KEY,
  INTERNAL_API_KEY_HEADER,
  INTERNAL_SERVICE_HEADER,
  InternalRequest,
  isInternalApiKeyMatch,
} from '@libs/core/internal-api/internal-api';

@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(
    private readonly coreConfig: CoreConfig,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & InternalRequest>();
    const apiKey = request.headers[INTERNAL_API_KEY_HEADER] as
      | string
      | undefined;
    const service = request.headers[INTERNAL_SERVICE_HEADER] as
      | string
      | undefined;

    if (!service) {
      throw UnauthorizedDomainException.create(
        'Internal service is missing',
        'internal-api',
      );
    }

    if (!apiKey) {
      throw UnauthorizedDomainException.create(
        'Internal API key is missing',
        'internal-api',
      );
    }

    const expectedApiKey = this.coreConfig.internalApiKeys?.[service];

    if (!expectedApiKey || !isInternalApiKeyMatch(apiKey, expectedApiKey)) {
      throw UnauthorizedDomainException.create(
        'Invalid internal API key',
        'internal-api',
      );
    }

    const allowedServices = this.reflector.getAllAndOverride<string[]>(
      INTERNAL_ALLOWED_SERVICES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (allowedServices?.length && !allowedServices.includes(service)) {
      throw UnauthorizedDomainException.create(
        'Internal service is not allowed',
        'internal-api',
      );
    }

    request.internalCaller = { service };

    return true;
  }
}
