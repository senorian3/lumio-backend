import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGoogleCallback() {
  return applyDecorators(
    ApiOperation({
      summary: 'Google callback',
      description: 'Endpoint for google callback',
      operationId: 'googleCallback',
    }),

    ApiResponse({
      status: 200,
      description: 'User successfully login via google',
      examples: {
        user_logined_via_google: {
          summary: 'User successfully login via google',
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
        iat_or_exp_not_verified: {
          summary: 'Refresh token is not verified',
          value: {
            extensions: [
              {
                errorsMessages: [
                  {
                    message: 'Refresh token is not verified',
                    field: 'refreshToken',
                  },
                ],
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
