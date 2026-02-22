import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiRefreshToken() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Refresh Token',
      description:
        'Endpoint for updating refresh token and returning new access token. Requires valid refresh token in cookie.',
      operationId: 'refreshToken',
    }),

    ApiResponse({
      status: 200,
      description: 'Successfully refreshed tokens',
      headers: {
        'Set-Cookie': {
          description: 'HTTP-only refresh token cookie',
          schema: {
            type: 'string',
            example:
              'refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...; Path=/; HttpOnly',
          },
        },
      },
      examples: {
        refresh_successful: {
          summary: 'Tokens successfully refreshed',
          value: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    }),

    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing refresh token',
      examples: {
        no_refresh_token: {
          summary: 'No refresh token in request',
          value: {
            errorsMessages: [
              {
                message: 'There is no refresh token in request',
                field: 'refreshToken',
              },
            ],
          },
        },
        session_not_found: {
          summary: 'Session not found in database',
          value: {
            errorsMessages: [
              {
                message: "User doesn't have session",
                field: 'deviceId',
              },
            ],
          },
        },
        session_mismatch: {
          summary: 'Session data mismatch (user, device, or expiry)',
          value: {
            errorsMessages: [
              {
                message: "User doesn't have session",
                field: 'session',
              },
            ],
          },
        },
        invalid_refresh_token: {
          summary: 'Invalid refresh token',
          value: {
            errorsMessages: [
              {
                message: 'There is no such session',
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
