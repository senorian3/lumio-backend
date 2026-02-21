import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

export function ApiUpdatePost() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update post',
      description:
        'Endpoint for update post description. Only post owner can update.',
      operationId: 'updatePost',
    }),

    ApiParam({
      name: 'postId',
      type: String,
      description: 'ID of the post to update',
      example: '65',
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Post successfully updated',
      examples: {
        success: {
          summary: 'Post updated successfully',
          value: {
            id: 'a16e733a-30a4-49c8-a923-61e34928aace',
            description: 'Обновленный пост',
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
        },
      },
    }),

    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        description_too_long: {
          summary: 'Description exceeds maximum length',
          value: {
            errorsMessages: [
              {
                message: 'Maximum number of characters 500',
                field: 'description',
              },
            ],
          },
        },
        invalid_description_format: {
          summary: 'Description is not a string',
          value: {
            errorsMessages: [
              {
                message: 'Description must be a string',
                field: 'description',
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
        post_not_found: {
          summary: 'Post does not exist',
          value: {
            errorsMessages: [
              {
                message: 'Post does not exist',
                field: 'post',
              },
            ],
          },
        },
      },
    }),
  );
}
