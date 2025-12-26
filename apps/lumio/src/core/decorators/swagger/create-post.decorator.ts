import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

export function ApiCreatePost() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create new post',
      description:
        'Endpoint for creating a new post. Accepts description and optional files. Returns created post with attached files.',
      operationId: 'createPost',
    }),

    ApiConsumes('multipart/form-data'),

    ApiBody({
      description: 'Post creation payload',
      schema: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            example: 'Мой первый пост',
          },
          files: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
    }),

    ApiResponse({
      status: 201,
      description: 'Post successfully created',
      example: {
        id: 62,
        description: 'Мой первый пост',
        createdAt: '2025-12-26T13:39:48.953Z',
        userId: 44,
        postFiles: [
          {
            id: 248,
            url: 'https://lumio-files-photo.storage.yandexcloud.net/content/posts/62/62_image_...',
            postId: 62,
          },
        ],
      },
    }),

    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        user_not_exist: {
          summary: 'User does not exist',
          value: {
            errorMessages: [{ message: 'User does not exist', field: 'user' }],
          },
        },
        no_files_uploaded: {
          summary: 'No files uploaded',
          value: {
            errorMessages: [
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
            errorMessages: [
              {
                message: 'Maximum 10 files allowed, but received 12',
                field: 'file',
              },
            ],
          },
        },
        file_too_large: {
          summary: 'File exceeds maximum size',
          value: {
            errorMessages: [
              {
                message: 'File 1 (big.png) exceeds maximum size of 20MB',
                field: 'file',
              },
            ],
          },
        },
        invalid_file_type: {
          summary: 'File type not supported',
          value: {
            errorMessages: [
              {
                message:
                  'File 1 (doc.pdf) has invalid type. Only JPEG and PNG files are allowed',
                field: 'file',
              },
            ],
          },
        },
        invalid_file_extension: {
          summary: 'File extension not supported',
          value: {
            errorMessages: [
              {
                message:
                  'File 1 (image.gif) has invalid extension. Only .jpg, .jpeg, and .png are allowed',
                field: 'file',
              },
            ],
          },
        },
        description_too_short: {
          summary: 'Description too short',
          value: {
            errorMessages: [
              {
                message: 'Minimum number of characters 3',
                field: 'description',
              },
            ],
          },
        },
      },
    }),

    ApiResponse({
      status: 401,
      description: 'Unauthorized',
      example: {
        errorMessages: [
          {
            message: 'Access token is missing or invalid',
            field: 'Authorization',
          },
        ],
      },
    }),
  );
}
