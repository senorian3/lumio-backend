import { applyDecorators } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGithubCallback() {
  return applyDecorators(
    ApiExcludeEndpoint(),
    ApiOperation({
      summary: 'Github callback',
      description: 'Endpoint for github callback',
      operationId: 'githubCallback',
    }),

    ApiResponse({
      status: 200,
      description: 'User successfully login via github',
      examples: {
        user_logined: {
          summary: 'User successfully login via github',
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
            errorMessages: [
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
            errorMessages: [
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
