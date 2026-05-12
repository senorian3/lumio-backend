import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function ApiDeletePost() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Delete post',
      description: 'Endpoint for delete post',
      operationId: 'deletePost',
    }),

    ApiParam({
      name: 'postId',
      type: String,
      description: 'UUID of the post to delete',
      example: 'a16e733a-30a4-49c8-a923-61e34928aace',
      required: true,
    }),

    ApiResponse({
      status: 204,
      description: 'Post successfully deleted',
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
                field: 'user',
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
