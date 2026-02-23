import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export function ApiGetMyPosts() {
  return applyDecorators(
    ApiBearerAuth(),
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
