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
            description: 'Image file (JPEG/PNG, max 5MB)',
          },
          userId: {
            type: 'string',
            description: 'User ID',
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
                message: 'Only JPEG and PNG files are allowed',
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
                message: 'File exceeds maximum size of 5MB',
                field: 'avatar',
              },
            ],
          },
        },
      },
    }),
  );
}
