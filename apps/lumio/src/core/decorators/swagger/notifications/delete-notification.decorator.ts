import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function ApiDeleteNotification() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Delete notification',
      description:
        'Soft deletes a specific notification for the current authorized user',
      operationId: 'deleteNotification',
    }),

    ApiParam({
      name: 'id',
      type: String,
      description: 'Notification UUID',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),

    ApiResponse({
      status: 204,
      description: 'Notification successfully deleted',
    }),

    ApiResponse({
      status: 401,
      description: 'Unauthorized',
      examples: {
        no_access_token: {
          summary: 'No access token in request',
          value: {
            errorsMessages: [],
          },
        },
        token_version_mismatch: {
          summary: 'Token version is expired',
          value: {
            errorsMessages: [
              {
                message: 'Token version mismatch - token is invalidated',
                field: 'tokenVersion',
              },
            ],
          },
        },
        invalid_jwt_data: {
          summary: 'Invalid user data in JWT',
          value: {
            errorsMessages: [
              {
                message: 'Invalid user data in JWT',
                field: 'user',
              },
            ],
          },
        },
        no_active_session: {
          summary: 'User does not have active session',
          value: {
            errorsMessages: [
              {
                message: "User doesn't have active session",
                field: 'session',
              },
            ],
          },
        },
      },
    }),

    ApiResponse({
      status: 404,
      description: 'Notification not found',
      examples: {
        not_found: {
          summary: 'Notification not found or belongs to another user',
          value: {
            errorsMessages: [
              {
                message: 'Notification not found',
                field: 'id',
              },
            ],
          },
        },
      },
    }),
  );
}
