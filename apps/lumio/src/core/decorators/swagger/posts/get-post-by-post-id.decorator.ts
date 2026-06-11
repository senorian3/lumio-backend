import { PostView } from '@lumio/modules/posts/api/dto/output/post.output.dto';
import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function ApiGetPostById() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get post by ID',
      description: 'Endpoint for retrieving a post by its ID',
      operationId: 'getPostById',
    }),

    ApiParam({
      name: 'postId',
      type: String,
      description: 'UUID of the post',
      example: 'a16e733a-30a4-49c8-a923-61e34928aace',
      required: true,
    }),

    ApiResponse({
      status: 200,
      description: 'Post successfully retrieved',
      type: PostView,
      example: {
        id: '03969ae5-d78d-4bae-b293-ab3370f3de8e',
        description: 'some create data for post',
        createdAt: '2026-02-19T21:17:16.278Z',
        userId: 1,
        likeCount: 12,
        dislikeCount: 2,
        userReaction: 'like',
        postFiles: [
          {
            id: 1,
            url: 'https://test-bucket-lumio.storage.yandexcloud.net/content/posts/.../.png',
            postId: '03969ae5-d78d-4bae-b293-ab3370f3de8e',
            createdAt: '2026-02-19T21:17:17.278Z',
          },
        ],
        newestLikes: [
          {
            userId: 51,
            username: 'jane_doe',
            avatarUrl: 'https://example.com/avatar.jpg',
            addedAt: '2026-02-19T22:17:16.278Z',
          },
        ],
      },
    }),

    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        invalid_post_id: {
          summary: 'Invalid post ID format',
          value: {
            errorsMessages: [
              {
                message: 'Post ID must be a valid UUID',
                field: 'postId',
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
