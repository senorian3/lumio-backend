import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiMarkAllNotificationsAsRead() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Mark all notifications as read',
      description:
        'Marks all unread notifications as read for the current authorized user',
      operationId: 'markAllNotificationsAsRead',
    }),

    ApiResponse({
      status: 204,
      description: 'All notifications successfully marked as read',
      examples: {
        success: {
          summary: 'Notifications marked as read',
          value: {},
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
