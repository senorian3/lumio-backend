import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

export function ApiCreatePost() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Create new post',
      description:
        'Endpoint for creating a new post. Accepts description and optional files. Returns created post with attached files.',
      operationId: 'createPost',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Post creation payload with optional files',
      schema: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Post description (max 500 characters)',
            example: 'My first post',
            minLength: 0,
            maxLength: 500,
          },
          files: {
            type: 'array',
            description:
              'Array of image files (JPEG/PNG, max 10 files, max 20MB each). At least 1 file required.',
            items: {
              type: 'string',
              format: 'binary',
            },
            minItems: 1,
            maxItems: 10,
          },
        },
        required: ['description'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Post successfully created',
      examples: {
        success: {
          summary: 'Post created with files',
          value: {
            id: 'a16e733a-30a4-49c8-a923-61e34928aace',
            description: 'Мой первый пост',
            createdAt: '2025-12-26T13:39:48.953Z',
            userId: 44,
            postFiles: [
              {
                id: 248,
                url: 'https://lumio-files-photo.storage.yandexcloud.net/content/posts/62/62_image_1.png',
                postId: 62,
              },
              {
                id: 249,
                url: 'https://lumio-files-photo.storage.yandexcloud.net/content/posts/62/62_image_2.jpg',
                postId: 62,
              },
            ],
          },
        },
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
        files_too_many: {
          summary: 'Too many files uploaded',
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
          summary: 'File exceeds maximum size (20MB)',
          value: {
            errorsMessages: [
              {
                message: 'File 1 (image.png) exceeds maximum size of 20MB',
                field: 'file',
              },
            ],
          },
        },
        files_invalid_type: {
          summary: 'File MIME type not supported',
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
        files_invalid_extension: {
          summary: 'File extension not supported',
          value: {
            errorsMessages: [
              {
                message:
                  'File 1 (image.gif) has invalid extension. Only .jpeg, and .png are allowed',
                field: 'file',
              },
            ],
          },
        },
        description_too_long: {
          summary: 'Description exceeds maximum length',
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
      status: 404,
      description: 'Not found',
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
        post_not_found: {
          summary: 'Post does not exist (after creation)',
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
  );
}
