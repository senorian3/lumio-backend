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
          userId: {
            type: 'number',
            description: 'User ID who uploaded the file',
            example: 1,
          },
        },
        required: ['files', 'postId', 'userId'],
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
        no_files_uploaded: {
          summary: 'No files uploaded',
          value: {
            errorsMessages: [
              {
                message: 'No files uploaded',
                field: 'file',
              },
            ],
          },
        },
        too_many_files: {
          summary: 'Too many files',
          value: {
            errorsMessages: [
              {
                message: 'Maximum 10 files allowed, but received 15',
                field: 'file',
              },
            ],
          },
        },
        file_too_large: {
          summary: 'File exceeds maximum size',
          value: {
            errorsMessages: [
              {
                message: 'File 1 (image.png) exceeds maximum size of 20MB',
                field: 'file',
              },
            ],
          },
        },
        invalid_file_type: {
          summary: 'Invalid file type',
          value: {
            errorsMessages: [
              {
                message:
                  'File 1 (image.gif) has invalid type. Only JPEG and PNG files are allowed',
                field: 'file',
              },
            ],
          },
        },
        post_id_required: {
          summary: 'Post ID is required',
          value: {
            errorsMessages: [
              {
                message: 'Post ID is required',
                field: 'postId',
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
        post_not_found: {
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
