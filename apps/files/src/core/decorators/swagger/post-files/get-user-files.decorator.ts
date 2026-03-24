import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiGetUserFiles() {
  return applyDecorators(
    ApiSecurity('internal'),
    ApiOperation({
      summary: 'Get all files uploaded by a user',
      description:
        'Internal endpoint for retrieving all post files uploaded by a specific user (excluding avatars). Supports pagination.',
      operationId: 'getUserFiles',
    }),
    ApiParam({
      name: 'userId',
      type: 'number',
      description: 'User ID',
      example: 1,
    }),
    ApiQuery({
      name: 'page',
      type: 'number',
      required: false,
      description: 'Page number (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      type: 'number',
      required: false,
      description: 'Number of files per page (default: 50)',
      example: 20,
    }),
    ApiResponse({
      status: 200,
      description: 'Successfully retrieved user files',
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
          {
            id: 249,
            url: 'https://lumio-files-photo.storage.yandexcloud.net/content/posts/uuid2/image2.jpg',
            postId: 'post-uuid-456',
          },
        ],
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        invalid_user_id: {
          summary: 'Invalid user ID',
          value: {
            errorsMessages: [
              {
                message: 'User ID must be a positive number',
                field: 'userId',
              },
            ],
          },
        },
        invalid_page: {
          summary: 'Invalid page parameter',
          value: {
            errorsMessages: [
              {
                message: 'Page must be a positive number',
                field: 'page',
              },
            ],
          },
        },
        invalid_limit: {
          summary: 'Invalid limit parameter',
          value: {
            errorsMessages: [
              {
                message: 'Limit must be between 1 and 100',
                field: 'limit',
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
        user_not_found: {
          summary: 'User not found',
          value: {
            errorsMessages: [
              {
                message: 'User does not exist',
                field: 'userId',
              },
            ],
          },
        },
      },
    }),
  );
}
