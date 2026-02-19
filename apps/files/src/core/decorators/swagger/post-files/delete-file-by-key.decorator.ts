import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiDeleteFileByKey() {
  return applyDecorators(
    ApiSecurity('internal'),
    ApiOperation({
      summary: 'Delete file by key',
      description: 'Internal endpoint for deleting a specific file by its key.',
      operationId: 'deleteFileByKey',
    }),
    ApiParam({
      name: 'key',
      description: 'File key/path',
      type: String,
      example: 'content/posts/uuid/image.jpg',
    }),
    ApiResponse({
      status: 204,
      description: 'File successfully deleted',
    }),
    ApiResponse({
      status: 404,
      description: 'File not found',
      examples: {
        not_found: {
          summary: 'File not found',
          value: {
            errorsMessages: [
              {
                message: 'File does not exist',
                field: 'key',
              },
            ],
          },
        },
      },
    }),
  );
}
