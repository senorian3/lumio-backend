import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

export function ApiDeletePost() {
  return applyDecorators(
    ApiSecurity('bearer'),
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

        file_not_deleted: {
          summary: 'Failed to delete files',
          value: {
            errorsMessages: [
              {
                message: 'Failed to delete files',
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
