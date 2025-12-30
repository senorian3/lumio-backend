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
      status: 400,
      description: 'Validation error',
      examples: {
        captcha_not_string: {
          summary: 'Failed reCAPTCHA verification',
          value: {
            errorMessages: [
              {
                message: 'Recaptcha token must be a string',
                field: 'recaptchaToken',
              },
            ],
          },
        },

        email_not_email: {
          summary: 'Email is not valid',
          value: {
            errorMessages: [
              {
                message: 'The email must match the format example@example.com',
                field: 'email',
              },
            ],
          },
        },
        email_min_length: {
          summary: 'Email too short',
          value: {
            errorMessages: [
              {
                message: 'Minimum number of characters 6',
                field: 'email',
              },
            ],
          },
        },
        email_max_length: {
          summary: 'Email too long',
          value: {
            errorMessages: [
              {
                message: 'Maximum number of characters 100',
                field: 'email',
              },
            ],
          },
        },
      },
    }),

    ApiResponse({
      status: 403,
      description: 'Forbidden access',
      examples: {
        failed_recaptcha: {
          summary: 'Failed reCAPTCHA verification',
          value: {
            errorMessages: [
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
            errorMessages: [
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
        errorsMessages: [
          {
            message: 'Too many requests',
          },
        ],
      },
    }),
  );
}
