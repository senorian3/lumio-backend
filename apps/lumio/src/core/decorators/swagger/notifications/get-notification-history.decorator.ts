import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

export function ApiGetNotificationHistory() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get user notification history',
      description:
        "Returns paginated list of notifications for the current authorized user's last 30 days",
      operationId: 'getNotificationHistory',
    }),
    ApiQuery({
      name: 'pageNumber',
      type: Number,
      required: false,
      description: 'Page number (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'pageSize',
      type: Number,
      required: false,
      description: 'Items per page (default: 10)',
      example: 10,
    }),
    ApiQuery({
      name: 'sortDirection',
      type: String,
      required: false,
      description: 'Sort direction for createdAt field (asc or desc)',
      example: 'desc',
      enum: ['asc', 'desc'],
    }),

    ApiResponse({
      status: 200,
      description: 'Notification history successfully retrieved',
      examples: {
        notifications_retrieved: {
          summary: 'Notifications successfully received',
          value: {
            pagesCount: 2,
            page: 2,
            pageSize: 2,
            totalCount: 4,
            unreadCount: 2,
            items: [
              {
                id: 'a5107593-08c8-4669-8371-594fda24d71e',
                title: 'Подписка активирована',
                message: 'Ваша подписка активирована и действует до 3/30/2026',
                isRead: false,
                createdAt: '2026-03-16T20:48:58.225Z',
              },
              {
                id: '5e3fc19c-97e9-45a1-995c-c5495298d481',
                title: 'Подписка активирована',
                message: 'Ваша подписка активирована и действует до 3/23/2026',
                isRead: true,
                createdAt: '2026-03-16T20:47:50.217Z',
              },
            ],
          },
        },
        empty_history: {
          summary: 'No notifications found',
          value: {
            pagesCount: 0,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            unreadCount: 0,
            items: [],
          },
        },
      },
    }),

    ApiResponse({
      status: 400,
      description: 'Bad Request (e.g., invalid query parameters)',
      examples: {
        invalid_page_number: {
          summary: 'Page number must be a positive integer',
          value: {
            errorsMessages: [
              {
                message: 'Page number must be a positive integer',
                field: 'pageNumber',
              },
            ],
          },
        },
        invalid_page_size: {
          summary: 'Page size must be a positive integer',
          value: {
            errorsMessages: [
              {
                message: 'Page size must be a positive integer',
                field: 'pageSize',
              },
            ],
          },
        },
        invalid_sort_direction: {
          summary: 'Sort direction must be asc or desc',
          value: {
            errorsMessages: [
              {
                message: 'Sort direction must be one of: asc, desc',
                field: 'sortDirection',
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
