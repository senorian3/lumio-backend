import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UnauthorizedDomainException } from '@libs/core/exceptions/domain-exceptions';
import { InternalRequest } from '@libs/core/internal-api/internal-api';

export const ActorUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest<any & InternalRequest>();

    if (!request.internalCaller) {
      throw UnauthorizedDomainException.create(
        'Internal caller is not verified',
        'internal-api',
      );
    }

    const actorUserIdHeader = request.headers['x-actor-user-id'];
    const actorUserIdValue = Array.isArray(actorUserIdHeader)
      ? actorUserIdHeader[0]
      : actorUserIdHeader;

    if (!actorUserIdValue) {
      throw UnauthorizedDomainException.create(
        'Actor user id header is missing',
        'x-actor-user-id',
      );
    }

    const actorUserId = Number(actorUserIdValue);

    if (!Number.isInteger(actorUserId) || actorUserId <= 0) {
      throw UnauthorizedDomainException.create(
        'Actor user id header is invalid',
        'x-actor-user-id',
      );
    }

    return actorUserId;
  },
);
