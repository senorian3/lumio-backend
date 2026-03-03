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
      status: 400,
      description: 'Bad Request',
      examples: {
        key_required: {
          summary: 'File key is required',
          value: {
            errorsMessages: [
              {
                message: 'File key is required',
                field: 'key',
              },
            ],
          },
        },
        invalid_key_format: {
          summary: 'Invalid key format',
          value: {
            errorsMessages: [
              {
                message: 'File key must be a valid string',
                field: 'key',
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found',
      examples: {
        file_not_found: {
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
