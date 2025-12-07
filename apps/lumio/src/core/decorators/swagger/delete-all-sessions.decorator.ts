import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiDeleteAllSessionsExceptCurrent() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete all user sessions except current',
      description:
        'Endpoint to terminate all sessions associated with the authenticated user, except the current active session',
      operationId: 'deleteAllSessionsExceptCurrent',
    }),

    ApiResponse({
      status: 204,
      description: 'Sessions successfully deleted (except current)',
    }),

    ApiResponse({
      status: 400,
      description: 'Bad Request',
      examples: {
        no_current_session: {
          summary: 'Current session not found',
          value: {
            errorsMessages: [
              {
                message: "Can't delete all sessions",
                field: 'session',
              },
            ],
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
