import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

export function ApiGetFeed() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get user feed',
      description:
        'Endpoint for getting personalized feed of posts from followed users with pagination.',
      operationId: 'getFeed',
    }),
    ApiQuery({
      name: 'pageNumber',
      description: 'Page number for pagination',
      required: false,
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'pageSize',
      description: 'Number of items per page',
      required: false,
      type: Number,
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Feed retrieved successfully',
      examples: {
        success: {
          summary: 'Paginated feed of posts',
          value: {
            items: [
              {
                id: 'a16e733a-30a4-49c8-a923-61e34928aace',
                description: 'Мой первый пост',
                createdAt: '2025-12-26T13:39:48.953Z',
                userId: 44,
                username: 'john_doe',
                avatarUrl: 'https://example.com/avatar.jpg',
                postFiles: [
                  {
                    id: 248,
                    url: 'https://lumio-files-photo.storage.yandexcloud.net/content/posts/62/62_image_1.png',
                    postId: 62,
                  },
                ],
                likeCount: 15,
                commentsCount: 3,
                userReaction: 'like',
              },
              {
                id: 'b27e844b-41b5-59d9-b034-72f45939bcef',
                description: 'Второй пост с несколькими фото',
                createdAt: '2025-12-25T10:20:30.123Z',
                userId: 45,
                username: 'jane_smith',
                avatarUrl: 'https://example.com/avatar2.jpg',
                postFiles: [
                  {
                    id: 249,
                    url: 'https://lumio-files-photo.storage.yandexcloud.net/content/posts/63/63_image_1.jpg',
                    postId: 63,
                  },
                  {
                    id: 250,
                    url: 'https://lumio-files-photo.storage.yandexcloud.net/content/posts/63/63_image_2.jpg',
                    postId: 63,
                  },
                ],
                likeCount: 42,
                commentsCount: 7,
                userReaction: 'none',
              },
            ],
            totalCount: 2,
            pagesCount: 1,
            page: 1,
            pageSize: 10,
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        invalid_page: {
          summary: 'Invalid page number',
          value: {
            errorsMessages: [
              {
                message: 'Page must be at least 1',
                field: 'page',
              },
            ],
          },
        },
        invalid_limit: {
          summary: 'Invalid limit value',
          value: {
            errorsMessages: [
              {
                message: 'Limit must be between 1 and 100',
                field: 'limit',
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
    ApiResponse({
      status: 429,
      description: 'Too many requests',
      examples: {
        too_many_requests: {
          summary: 'Too many requests',
          value: {
            errorsMessages: [
              {
                message: 'Too many requests',
                field: null,
              },
            ],
          },
        },
      },
    }),
  );
}
