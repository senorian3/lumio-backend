import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { MarkNotificationsAsReadInputDto } from '@lumio/modules/notifications/api/dto/input/mark-notifications-as-read.input.dto';

export function ApiMarkNotificationsAsRead() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Mark notifications as read',
      description: 'Mark multiple notifications as read by their IDs',
      operationId: 'markNotificationsAsRead',
    }),
    ApiBody({
      type: MarkNotificationsAsReadInputDto,
      examples: {
        mark_single: {
          summary: 'Mark single notification as read',
          value: {
            notificationIds: ['a5107593-08c8-4669-8371-594fda24d71e'],
          },
        },
        mark_multiple: {
          summary: 'Mark multiple notifications as read',
          value: {
            notificationIds: [
              'a5107593-08c8-4669-8371-594fda24d71e',
              '5e3fc19c-97e9-45a1-995c-c5495298d481',
            ],
          },
        },
        mark_all: {
          summary: 'Mark all notifications as read',
          value: {
            notificationIds: [
              'a5107593-08c8-4669-8371-594fda24d71e',
              '5e3fc19c-97e9-45a1-995c-c5495298d481',
              'b3fc29d-98e9-46b2-996d-d6596399e482',
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 204,
      description: 'Notifications successfully marked as read',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request (e.g., invalid notification IDs)',
      examples: {
        empty_array: {
          summary: 'Notification IDs array cannot be empty',
          value: {
            errorsMessages: [
              {
                message: 'notificationIds must contain at least 1 elements',
                field: 'notificationIds',
              },
            ],
          },
        },
        invalid_ids: {
          summary: 'Notification IDs must be strings',
          value: {
            errorsMessages: [
              {
                message: 'Each value in notificationIds must be a string',
                field: 'notificationIds',
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
        no_access_token: {
          summary: 'No access token in request',
          value: {
            errorsMessages: [],
          },
        },
      },
    }),
  );
}
