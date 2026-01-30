import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiCreatePost() {
  return applyDecorators(
    ApiSecurity('bearer'),
    ApiOperation({
      summary: 'Create new post',
      description:
        'Endpoint for creating a new post. Accepts description and optional files. Returns created post with attached files.',
      operationId: 'createPost',
    }),

    ApiConsumes('multipart/form-data'),
    ApiBody({
      description:
        'Post creation payload. Use JSON for text-only or FormData for text with files',
      schema: {
        oneOf: [
          {
            type: 'object',
            properties: {
              description: {
                type: 'string',
                description: 'Post description',
                example: 'My first post',
                minLength: 0,
                maxLength: 500,
              },
            },
            required: ['description'],
            title: 'JSON Payload (text only)',
          },
          {
            type: 'object',
            properties: {
              description: {
                type: 'string',
                description: 'Post description',
                example: 'My first post',
                minLength: 0,
                maxLength: 500,
              },
              files: {
                type: 'array',
                description:
                  'Array of image files (JPEG/PNG, max 10 files, max 20MB each)',
                items: {
                  type: 'string',
                  format: 'binary',
                },
                minItems: 0,
                maxItems: 10,
              },
            },
            required: ['description'],
            title: 'FormData Payload (text + files)',
          },
        ],
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
        user_does_not_exist: {
          summary: 'User does not exist',
          value: {
            errorsMessages: [{ message: 'User does not exist', field: 'user' }],
          },
        },
        post_does_not_exist: {
          summary: 'Post does not exist',
          value: {
            errorsMessages: [{ message: 'Post does not exist', field: 'post' }],
          },
        },
        files_not_uploaded: {
          summary: 'No files uploaded',
          value: {
            errorsMessages: [
              {
                message: 'Failed to upload files',
                field: 'file',
              },
            ],
          },
        },
        files_too_many: {
          summary: 'Too many files',
          value: {
            errorsMessages: [
              {
                message: 'Maximum 10 files allowed, but received {count}',
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
                message:
                  'File {index} filename}.{extension} exceeds maximum size of 20MB',
                field: 'file',
              },
            ],
          },
        },
        files_invalid_type: {
          summary: 'File type not supported',
          value: {
            errorsMessages: [
              {
                message:
                  'File {index} filename}.{extension} has invalid type. Only JPEG and PNG files are allowed',
                field: 'file',
              },
            ],
          },
        },
        files_invalid_extension: {
          summary: 'File extension not supported',
          value: {
            errorsMessages: [
              {
                message:
                  'File {index} {filename}.{extension} has invalid extension. Only .jpg, .jpeg, and .png are allowed',
                field: 'file',
              },
            ],
          },
        },
        description_too_long: {
          summary: 'Description too long',
          value: {
            errorsMessages: [
              {
                message: 'Maximum number of characters 500',
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
  );
}
