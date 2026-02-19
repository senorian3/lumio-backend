import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiNewPassword() {
  return applyDecorators(
    ApiOperation({
      summary: 'User create new password',
      description: 'Endpoint for create new password',
      operationId: 'newPassword',
    }),

    ApiResponse({
      status: 200,
      description: 'User create new password successfully',
    }),

    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        user_not_found: {
          summary: 'User does not exist',
          value: {
            errorsMessages: [
              {
                message: 'User does not exist',
                field: 'email',
              },
            ],
          },
        },
        password_min_length: {
          summary: 'Password too short',
          value: {
            errorsMessages: [
              {
                message: 'Minimum number of characters 6',
                field: 'password',
              },
            ],
          },
        },
        password_max_length: {
          summary: 'Password too long',
          value: {
            errorsMessages: [
              {
                message: 'Maximum number of characters 20',
                field: 'password',
              },
            ],
          },
        },
        password_not_string: {
          summary: 'Password is not a string',
          value: {
            errorsMessages: [
              {
                message: 'Password must be a string',
                field: 'password',
              },
            ],
          },
        },
        password_lowercase: {
          summary: 'Password must contain lowercase letter',
          value: {
            errorsMessages: [
              {
                message: 'Password must contain at least one lowercase letter',
                field: 'password',
              },
            ],
          },
        },
        password_uppercase: {
          summary: 'Password must contain uppercase letter',
          value: {
            errorsMessages: [
              {
                message: 'Password must contain at least one uppercase letter',
                field: 'password',
              },
            ],
          },
        },
        password_number: {
          summary: 'Password must contain number',
          value: {
            errorsMessages: [
              {
                message: 'Password must contain at least one number',
                field: 'password',
              },
            ],
          },
        },
        password_allowed_chars: {
          summary: 'Password contains invalid characters',
          value: {
            errorsMessages: [
              {
                message:
                  'Password can only contain letters, numbers and allowed special characters',
                field: 'password',
              },
            ],
          },
        },
        recovery_code_not_string: {
          summary: 'Recovery code is not a string',
          value: {
            errorsMessages: [
              {
                message: 'Recovery code must be a string',
                field: 'recoveryCode',
              },
            ],
          },
        },
      },
    }),

    ApiResponse({
      status: 429,
      description: 'Too many requests',
      example: {
        errorsMessages: [
          {
            message: 'Too many requests',
          },
        ],
      },
    }),
  );
}
