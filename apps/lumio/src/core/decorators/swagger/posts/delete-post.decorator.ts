import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiDeletePost() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Delete post',
      description: 'Endpoint for delete post',
      operationId: 'deletePost',
    }),

    ApiResponse({
      status: 204,
      description: 'Post successfully deleted',
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
