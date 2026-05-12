import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { SortDirection } from '@libs/core/dto/pagination/base.query-params.input-dto';
import { PostsSortBy } from '@lumio/modules/posts/api/dto/input/get-all-user-posts.query.dto';

export function ApiGetUserPosts() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get user posts',
      description: 'Endpoint for get user posts',
      operationId: 'getUserPosts',
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
      name: 'sortBy',
      enum: PostsSortBy,
      required: false,
      description: 'Field to sort by (default: createdAt)',
      example: PostsSortBy.CREATED_AT,
    }),
    ApiQuery({
      name: 'sortDirection',
      enum: SortDirection,
      required: false,
      description: 'Sort direction (default: desc)',
      example: SortDirection.Desc,
    }),

    ApiResponse({
      status: 200,
      description: 'User posts successfully fetched',
      examples: {
        success: {
          summary: 'Example response',
          value: {
            pagesCount: 1,
            page: 1,
            pageSize: 10,
            totalCount: 5,
            role: 'viewer',
            items: [
              {
                id: 'a16e733a-30a4-49c8-a923-61e34928aace',
                description: 'Мой первый пост',
                createdAt: '2026-01-08T07:16:03.016Z',
                userId: 46,
                postFiles: [
                  {
                    id: 6,
                    url: 'https://test-bucket-lumio.storage.yandexcloud.net/content/posts/65/65_image_1_b8ab8ba8.png',
                    postId: 65,
                  },
                ],
              },
            ],
          },
        },
      },
    }),

    ApiResponse({
      status: 400,
      description: 'Validation error',
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
      status: 404,
      description: 'Not found',
      examples: {
        user_not_found: {
          summary: 'User does not exist',
          value: {
            errorsMessages: [
              {
                message: 'User does not exist',
                field: 'userId',
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
