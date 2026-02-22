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
      status: 302, // Изменено с 200 на 302, так как используется res.redirect()
      description:
        'Redirects to frontend URL with accessToken in query params and refreshToken in cookie',
      headers: {
        'Set-Cookie': {
          description: 'HTTP-only refresh token cookie',
          schema: {
            type: 'string',
            example:
              'refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...; Path=/; HttpOnly',
          },
        },
        Location: {
          description: 'Frontend URL with accessToken in query string',
          schema: {
            type: 'string',
            example:
              'https://frontend.com/auth/oauth-success?accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
          },
        },
      },

      examples: {
        redirect_success: {
          summary: 'Redirect to frontend',
          value: {},
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
