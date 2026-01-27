import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UnauthorizedDomainException } from '@libs/core/exceptions/domain-exceptions';
import { CoreConfig } from '@payments/core/core.config';

@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(private readonly coreConfig: CoreConfig) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-internal-api-key'] as string | undefined;

    if (!apiKey) {
      throw UnauthorizedDomainException.create(
        'Internal API key is missing',
        'internal-api',
      );
    }

    if (apiKey !== this.coreConfig.internalApiKey) {
      throw UnauthorizedDomainException.create(
        'Invalid internal API key',
        'internal-api',
      );
    }

    return true;
  }
}
