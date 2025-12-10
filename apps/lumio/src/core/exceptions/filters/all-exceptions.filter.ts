import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { CoreConfig, Environments } from '../../core.config';
import { BaseExceptionFilter } from '@libs/core/exceptions/filters/base-exception.filter';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  constructor(private readonly coreConfig: CoreConfig) {
    super();
  }
  onCatch(exception: unknown, response: Response): void {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const isProduction = this.coreConfig.env === Environments.PRODUCTION;

    if (HttpStatus.INTERNAL_SERVER_ERROR === status) {
      console.error(exception);
    }

    if (HttpStatus.TOO_MANY_REQUESTS === status) {
      response.status(status).json({
        errorsMessages: [
          {
            message: 'Too many requessts',
          },
        ],
      });
      return;
    }

    if (isProduction && status === HttpStatus.INTERNAL_SERVER_ERROR) {
      response.status(status).json({
        ...this.getDefaultHttpBody(exception),
        path: null,
        message: 'Some error occurred',
      });

      return;
    }

    response.status(status).json(this.getDefaultHttpBody(exception));
  }
}
