import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiUploadUserAvatar() {
  return applyDecorators(
    ApiSecurity('internal'),
    ApiOperation({
      summary: 'Upload user avatar',
      description:
        'Internal endpoint for uploading user avatar image. Accepts image file and userId.',
      operationId: 'uploadUserAvatar',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Avatar upload payload',
      schema: {
        type: 'object',
        properties: {
          avatar: {
            type: 'string',
            format: 'binary',
            description: 'Image file (JPEG/PNG, max 10MB)',
          },
          userId: {
            type: 'string',
            description: 'User ID (will be converted to number)',
            example: '123',
          },
        },
        required: ['avatar', 'userId'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Avatar successfully uploaded',
      schema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL of uploaded avatar',
            example:
              'https://lumio-files-photo.storage.yandexcloud.net/avatars/123_avatar.jpg',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        invalid_file_type: {
          summary: 'Invalid file type',
          value: {
            errorsMessages: [
              {
                message:
                  'File "avatar.gif" has invalid MIME type (image/gif). Only JPEG and PNG files are allowed',
                field: 'avatar',
              },
            ],
          },
        },
        file_too_large: {
          summary: 'File exceeds maximum size',
          value: {
            errorsMessages: [
              {
                message: 'File "avatar.jpg" exceeds maximum size of 10MB',
                field: 'avatar',
              },
            ],
          },
        },
        invalid_user_id: {
          summary: 'Invalid user ID format',
          value: {
            errorsMessages: [
              {
                message: 'User ID must be a valid number',
                field: 'userId',
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
      examples: {
        user_not_found: {
          summary: 'User does not exist',
          value: {
            errorsMessages: [
              {
                message: 'User not found',
                field: 'userId',
              },
            ],
          },
        },
      },
    }),
  );
}
