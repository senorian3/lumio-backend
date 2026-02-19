import { PostView } from '@lumio/modules/posts/api/dto/output/post.output.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

export function ApiGetPostById() {
  return applyDecorators(
    ApiSecurity('bearer'),
    ApiOperation({
      summary: 'Get post by ID',
      description: 'Endpoint for retrieving a post by its ID',
      operationId: 'getPostById',
    }),

    ApiResponse({
      status: 200,
      description: 'Post successfully retrieved',
      type: PostView,
      example: {
        id: 2,
        description: 'some create data for post',
        createdAt: '2026-02-19T21:03:10.516Z',
        userId: 1,
        postFiles: [
          {
            id: 1,
            url: 'https://test-bucket-lumio.storage.yandexcloud.net/content/posts/2/2_image_1_0bff1de0.png',
            postId: 2,
          },
        ],
      },
    }),

    ApiResponse({
      status: 400,
      description: 'Bad request',
      examples: {
        post_does_not_exist: {
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

    ApiResponse({
      status: 401,
      description: 'Unauthorized',
      examples: {
        invalid_user_data: {
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
          summary: "User doesn't have active session",
          value: {
            errorsMessages: [
              {
                message: "User doesn't have active session",
                field: 'session',
              },
            ],
          },
        },
        token_version_mismatch: {
          summary: 'Token version mismatch - token is invalidated',
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
      status: 404,
      description: 'Not found',
      examples: {
        profile_not_found: {
          summary: 'Profile is not found',
          value: {
            errorsMessages: [
              {
                message: 'Profile is not found',
                field: 'userId',
              },
            ],
          },
        },
      },
    }),
  );
}
