import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
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
    ApiBody({
      description: 'File key to delete',
      schema: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'File key/path',
            example: 'content/posts/uuid/image.jpg',
          },
        },
        required: ['key'],
      },
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
