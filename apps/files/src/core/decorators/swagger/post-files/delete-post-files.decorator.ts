import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiDeletePostFiles() {
  return applyDecorators(
    ApiSecurity('internal'),
    ApiOperation({
      summary: 'Delete all files for a post',
      description:
        'Internal endpoint for deleting all files associated with a specific post.',
      operationId: 'deletePostFiles',
    }),
    ApiParam({
      name: 'postId',
      type: String,
      description: 'Post ID',
      example: 'post-uuid-123',
    }),
    ApiResponse({
      status: 204,
      description: 'All post files successfully deleted',
    }),
    ApiResponse({
      status: 404,
      description: 'Post not found',
      examples: {
        not_found: {
          summary: 'Post not found',
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
