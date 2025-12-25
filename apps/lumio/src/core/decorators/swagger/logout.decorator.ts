import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiLogout() {
  return applyDecorators(
    ApiOperation({
      summary: 'User logout',
      description: 'Endpoint for user logout',
      operationId: 'logoutUser',
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
          summary: 'No accessToken token in request',
          value: {
            errorMessages: [
              {
                message: 'There is no access token in request',
                field: 'accessToken',
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
  );
}
