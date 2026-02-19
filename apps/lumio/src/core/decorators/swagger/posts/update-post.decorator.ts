import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

export function ApiUpdatePost() {
  return applyDecorators(
    ApiSecurity('bearer'),
    ApiOperation({
      summary: 'Update post',
      description: 'Endpoint for update post',
      operationId: 'updatePost',
    }),

    ApiResponse({
      status: 200,
      description: 'Post successfully updated',
      example: {
        id: 65,
        description: 'Мой первый пост',
        createdAt: '2026-01-08T07:16:03.016Z',
        userId: 46,
        postFiles: [
          {
            id: 6,
            url: 'https://test-bucket-lumio.storage.yandexcloud.net/content/posts/65/65_image_1_b8ab8ba8.png?...',
          },
        ],
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
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
      status: 401,
      description: 'Unauthorized',
      examples: {
        expired_token_version: {
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
      },
    }),

    ApiResponse({
      status: 403,
      description: 'Forbidden',
      examples: {
        user_doesnt_own_post: {
          summary: 'Post does not belong to the user',
          value: {
            errorsMessages: [
              {
                message: 'Post does not belong to the user',
                field: 'post',
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
        post_not_found: {
          summary: 'Post does not exist',
          value: {
            errorsMessages: [
              {
                message: 'Post does not exist',
                field: 'postId',
              },
            ],
          },
        },
      },
    }),
  );
}
