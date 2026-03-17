import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetUnreadCount() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get unread notifications count',
      description:
        'Returns the number of unread notifications for the current authorized user',
      operationId: 'getUnreadNotificationsCount',
    }),

    ApiResponse({
      status: 200,
      description: 'Unread count successfully retrieved',
      schema: {
        type: 'object',
        properties: {
          unreadCount: {
            type: 'number',
            example: 5,
            description: 'Number of unread notifications',
          },
        },
      },
      examples: {
        unread_count: {
          summary: 'Unread count retrieved',
          value: {
            unreadCount: 5,
          },
        },
        no_unread: {
          summary: 'No unread notifications',
          value: {
            unreadCount: 0,
          },
        },
      },
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
  );
}
