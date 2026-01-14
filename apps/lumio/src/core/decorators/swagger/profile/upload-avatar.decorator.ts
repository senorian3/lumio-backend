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
    ApiSecurity('bearer'),
    ApiOperation({
      summary: 'Upload user avatar',
      description:
        'Endpoint for uploading a user profile avatar. Accepts single image file (JPEG/PNG). Returns URL of uploaded avatar.',
      operationId: 'uploadUserAvatar',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Avatar upload payload (multipart/form-data)',
      schema: {
        type: 'object',
        properties: {
          avatar: {
            type: 'string',
            format: 'binary',
            description: 'Avatar image file',
            example: 'avatar.jpg',
          },
        },
        required: ['avatar'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Avatar successfully uploaded',
      example: {
        url: 'https://lumio-files-photo.storage.yandexcloud.net/avatars/44/avatar_123456.jpg',
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error or business rule violation',
      examples: {
        no_file_uploaded: {
          summary: 'No file uploaded',
          value: {
            errorMessages: [{ message: 'No file uploaded', field: 'file' }],
          },
        },
        file_too_large: {
          summary: 'File exceeds maximum size',
          value: {
            errorMessages: [
              {
                message: 'File "avatar.jpg" exceeds maximum size of 10MB',
                field: 'file',
              },
            ],
          },
        },
        invalid_mime_type: {
          summary: 'Invalid file MIME type',
          value: {
            errorMessages: [
              {
                message:
                  'File "avatar.gif" has invalid MIME type (image/gif). Only JPEG and PNG files are allowed',
                field: 'file',
              },
            ],
          },
        },
        invalid_extension: {
          summary: 'Invalid file extension',
          value: {
            errorMessages: [
              {
                message:
                  'File "avatar.bmp" has invalid extension (.bmp). Only .jpg, .jpeg, and .png are allowed',
                field: 'file',
              },
            ],
          },
        },
        mime_extension_mismatch: {
          summary: 'MIME type and extension mismatch',
          value: {
            errorMessages: [
              {
                message:
                  'File "avatar.jpg" has mismatched MIME type and extension',
                field: 'file',
              },
            ],
          },
        },
        user_not_found: {
          summary: 'User does not exist',
          value: {
            errorMessages: [
              { message: 'User does not exist', field: 'userId' },
            ],
          },
        },
        upload_failed: {
          summary: 'Avatar upload failed',
          value: {
            errorMessages: [
              { message: 'Failed to upload avatar', field: 'user' },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - invalid or expired token',
      examples: {
        expired_token: {
          summary: 'Token version is expired',
          value: {
            errorMessages: [
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
