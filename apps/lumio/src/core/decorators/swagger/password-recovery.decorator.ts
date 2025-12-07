import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiPasswordRecovery() {
  return applyDecorators(
    ApiOperation({
      summary: 'Password recovery',
      description: 'Endpoint for password recovery',
      operationId: 'passwordRecovery',
    }),

    ApiResponse({
      status: 204,
      description: 'Password successfully recovered',
    }),

    ApiResponse({
      status: 403,
      description: 'Validation error',
      examples: {
        failed_recaptcha: {
          summary: 'Failed reCAPTCHA verification',
          value: {
            extensions: [
              {
                message: 'reCAPTCHA verification failed',
                field: 'recaptchaToken',
              },
            ],
          },
        },
        user_not_found: {
          summary: 'User is not found',
          value: {
            extensions: [
              {
                message: 'User does not exist',
                field: 'email',
              },
            ],
          },
        },
      },
    }),

    ApiResponse({
      status: 429,
      description: 'Too many requests',
      example: {
        extensions: [
          {
            errorsMessages: [
              {
                message: 'Too many requests',
              },
            ],
          },
        ],
      },
    }),
  );
}
