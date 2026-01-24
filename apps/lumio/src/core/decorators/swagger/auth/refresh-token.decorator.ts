import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

export function ApiRefreshToken() {
  return applyDecorators(
    ApiSecurity('refreshToken'),
    ApiOperation({
      summary: 'Refresh Token',
      description:
        'Endpoint for updating refresh token and returning new access token.',
      operationId: 'refreshToken',
    }),

    ApiResponse({
      status: 200,
      description: 'Successfully refreshed tokens',
      schema: {
        example: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
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
      status: 401,
      description: 'Unauthorized',
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
        no_session: {
          summary: 'Session not found',
          value: {
            errorsMessages: [
              {
                message: "User doesn't have session",
                field: 'deviceId',
              },
            ],
          },
        },
        wrong_payload_validation: {
          summary: 'Wrong payload validation',
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
                field: 'InvalidRefreshToken',
              },
            ],
          },
        },
        token_version_mismatch: {
          summary: 'Token version mismatch',
          value: {
            errorsMessages: [
              {
                message: 'Token version mismatch',
                field: 'tokenVersion',
              },
            ],
          },
        },
      },
    }),
  );
}
