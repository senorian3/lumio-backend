import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetAllSessions() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all user sessions',
      description:
        'Endpoint to retrieve all sessions associated with the authenticated user',
      operationId: 'getUserSessions',
    }),

    ApiResponse({
      status: 200,
      description: 'List of active user sessions',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            deviceName: { type: 'string', example: 'MyCustomAgent/1.98765' },
            ip: { type: 'string', example: '::1' },
            lastActiveDate: {
              type: 'string',
              format: 'date-time',
              example: '2025-12-07T18:33:42.000Z',
            },
          },
        },
      },
    }),

    ApiResponse({
      status: 400,
      description: 'Bad Request – unable to get user sessions',
      example: {
        errorsMessages: [
          {
            message: 'Cant get all devices',
            field: 'userId',
          },
        ],
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
        session_not_found: {
          summary: 'Session not found for device',
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
          summary: 'Session mismatch',
          value: {
            errorsMessages: [
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
