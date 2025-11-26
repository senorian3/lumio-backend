import { DomainExceptionCode } from './domain-exception-codes';

export class ErrorExtension {
  constructor(
    public message: string,
    public field: string | null = null,
  ) {}
}

export class DomainException extends Error {
  constructor(
    public message: string,
    public code: DomainExceptionCode,
    public extensions: ErrorExtension[],
  ) {
    super(message);
  }
}

function ConcreteDomainExceptionFactory(
  commonMessage: string,
  code: DomainExceptionCode,
) {
  return class extends DomainException {
    constructor(extensions: ErrorExtension[]) {
      super(commonMessage, code, extensions);
    }

    static create(message?: string, field?: string) {
      return new this(message ? [new ErrorExtension(message, field)] : []);
    }
  };
}

export const NotFoundDomainException = ConcreteDomainExceptionFactory(
  'Not Found',
  DomainExceptionCode.NotFound,
);

export const BadRequestDomainException = ConcreteDomainExceptionFactory(
  'Bad Request',
  DomainExceptionCode.BadRequest,
);

export const ForbiddenDomainException = ConcreteDomainExceptionFactory(
  'Forbidden',
  DomainExceptionCode.Forbidden,
);

export const UnauthorizedDomainException = ConcreteDomainExceptionFactory(
  'Unauthorized',
  DomainExceptionCode.Unauthorized,
);

export const TooManyRequestsDomainException = ConcreteDomainExceptionFactory(
  'Too Many Requests',
  DomainExceptionCode.TooManyRequests,
);

export const InternalServerDomainException = ConcreteDomainExceptionFactory(
  'Internal Server Error',
  DomainExceptionCode.Internal,
);

export const IAmATeapotDomainException = ConcreteDomainExceptionFactory(
  'I am a teapot',
  DomainExceptionCode.IAmATeapot,
);
