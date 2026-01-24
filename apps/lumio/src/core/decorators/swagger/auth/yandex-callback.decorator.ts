import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiYandexCallback() {
  return applyDecorators(
    ApiOperation({
      summary: 'Yandex callback',
      description: 'Endpoint for yandex callback and login user wtith redirect',
      operationId: 'yandexCallback',
    }),

    ApiResponse({
      status: 200,
      description: 'User successfully login via yandex',
      examples: {
        user_logined_via_yandex: {
          summary: 'User successfully login via yandex',
          value: {
            accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
          },
        },
      },
      headers: {
        'Set-Cookie': {
          description: 'HTTP-only refresh token cookie',
          schema: {
            type: 'string',
            example: 'refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
          },
        },
      },
    }),

    ApiResponse({
      status: 403,
      description: 'Forbidden access',
      examples: {
        refresh_token_not_verified: {
          summary: 'Refresh token is not verified',
          value: {
            errorsMessages: [
              {
                message: 'Refresh token is not verified',
                field: 'refreshToken',
              },
            ],
          },
        },
      },
    }),

    ApiResponse({
      status: 429,
      description: 'Too many requests',
      examples: {
        too_many_requests: {
          summary: 'Too many requests',
          value: {
            errorsMessages: [
              {
                message: 'Too many requests',
                field: null,
              },
            ],
          },
        },
      },
    }),
  );
}
