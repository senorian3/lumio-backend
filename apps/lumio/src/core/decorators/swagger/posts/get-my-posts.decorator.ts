import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

export function ApiGetMyPosts() {
  return applyDecorators(
    ApiSecurity('bearer'),
    ApiOperation({
      summary: 'Get user posts',
      description: 'Endpoint for get user posts',
      operationId: 'getUserPosts',
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
            items: [
              {
                id: 65,
                description: 'Мой первый пост',
                createdAt: '2026-01-08T07:16:03.016Z',
                userId: 46,
                postFiles: [
                  {
                    id: 6,
                    url: 'https://test-bucket-lumio.storage.yandexcloud.net/content/posts/65/65_image_1_b8ab8ba8.png?...',
                    postId: 65,
                  },
                  {
                    id: 7,
                    url: 'https://test-bucket-lumio.storage.yandexcloud.net/content/posts/65/65_image_2_2d5cd9ee.png?...',
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
        files_not_found: {
          summary: 'Failed to fetch files',
          value: {
            errorMessages: [
              {
                message: 'Failed to fetch files',
                field: 'files',
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
        expired_token_version: {
          summary: 'Token version is expired',
          value: {
            errorMessages: [
              {
                message: 'Token version mismatch - token is invalidated',
                field: 'tokenVersion',
              },
            ],
          },
        },
      },
    }),
  );
}
