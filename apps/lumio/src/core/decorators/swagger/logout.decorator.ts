import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiLogout() {
  return applyDecorators(
    ApiOperation({
      summary: 'User logout',
      description: 'Endpoint for user logout',
      operationId: 'logoutUser',
    }),

    ApiHeader({
      name: 'Cookie',
      description: 'Refresh token',
      required: true,
    }),

    ApiResponse({
      status: 204,
      description: 'User successfully logout',
    }),

    ApiResponse({
      status: 401,
      description: 'Unauthorized',
      examples: {
        no_refresh_token: {
          summary: 'No refresh token in request',
          value: {
            errorMessages: [
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
            errorMessages: [
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
            errorMessages: [
              {
                message: "User doesn't have session",
                field: 'session',
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
