import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

export function ApiUploadUserAvatar() {
  return applyDecorators(
    ApiBearerAuth(),
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
      description: 'Validation error or file processing violation',
      examples: {
        no_file_uploaded: {
          summary: 'No file uploaded',
          value: {
            errorsMessages: [{ message: 'No file uploaded', field: 'file' }],
          },
        },
        file_too_large: {
          summary: 'File exceeds maximum size',
          value: {
            errorsMessages: [
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
            errorsMessages: [
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
            errorsMessages: [
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
            errorsMessages: [
              {
                message:
                  'File "avatar.jpg" has mismatched MIME type and extension',
                field: 'file',
              },
            ],
          },
        },
        upload_failed: {
          summary: 'Avatar upload failed',
          value: {
            errorsMessages: [
              { message: 'Failed to upload avatar', field: 'file' },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - invalid token or session',
      examples: {
        no_access_token: {
          summary: 'No access token in request',
          value: {
            errorsMessages: [],
          },
        },
        invalid_user_data: {
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
          summary: "User doesn't have active session",
          value: {
            errorsMessages: [
              {
                message: "User doesn't have active session",
                field: 'session',
              },
            ],
          },
        },
        expired_token: {
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
    ApiResponse({
      status: 404,
      description: 'User not found',
      examples: {
        user_not_found: {
          summary: 'User does not exist',
          value: {
            errorsMessages: [
              { message: 'User does not exist', field: 'userId' },
            ],
          },
        },
      },
    }),
  );
}
