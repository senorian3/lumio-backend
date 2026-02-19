import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiUploadPostFiles() {
  return applyDecorators(
    ApiSecurity('internal'),
    ApiOperation({
      summary: 'Upload files for a post',
      description:
        'Internal endpoint for uploading multiple image files for a post.',
      operationId: 'uploadPostFiles',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Post files upload payload',
      schema: {
        type: 'object',
        properties: {
          files: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
            },
            description:
              'Array of image files (JPEG/PNG, max 10 files, max 20MB each)',
          },
          postId: {
            type: 'string',
            description: 'Post ID',
            example: 'post-uuid-123',
          },
        },
        required: ['files', 'postId'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Files successfully uploaded',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            url: { type: 'string' },
            postId: { type: 'string' },
          },
        },
        example: [
          {
            id: 248,
            url: 'https://lumio-files-photo.storage.yandexcloud.net/content/posts/uuid/image.jpg',
            postId: 'post-uuid-123',
          },
        ],
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        too_many_files: {
          summary: 'Too many files',
          value: {
            errorsMessages: [
              {
                message: 'Maximum 10 files allowed',
                field: 'files',
              },
            ],
          },
        },
        file_too_large: {
          summary: 'File exceeds maximum size',
          value: {
            errorsMessages: [
              {
                message: 'File exceeds maximum size of 20MB',
                field: 'files',
              },
            ],
          },
        },
      },
    }),
  );
}
