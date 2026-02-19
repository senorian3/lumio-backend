import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiRegistration() {
  return applyDecorators(
    ApiOperation({
      summary: 'User registration',
      description: 'Endpoint for user registration',
      operationId: 'registerUser',
    }),

    ApiResponse({
      status: 201,
      description: 'User successfully registered',
    }),

    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        user_already_registered: {
          summary: 'User already registered',
          value: {
            errorsMessages: [
              {
                message: 'User with this username is already registered',
                field: 'username',
              },
            ],
          },
        },
        email_already_registered: {
          summary: 'Email already registered',
          value: {
            errorsMessages: [
              {
                message: 'User with this email is already registered',
                field: 'email',
              },
            ],
          },
        },
        email_confirmation_not_found: {
          summary: 'Email confirmation not found',
          value: {
            errorsMessages: [
              {
                message: 'Email confirmation not found',
                field: 'emailConfirmation',
              },
            ],
          },
        },
        username_min_length: {
          summary: 'Username too short',
          value: {
            errorsMessages: [
              {
                message: 'Minimum number of characters 6',
                field: 'username',
              },
            ],
          },
        },
        username_max_length: {
          summary: 'Username too long',
          value: {
            errorsMessages: [
              {
                message: 'Maximum number of characters 30',
                field: 'username',
              },
            ],
          },
        },
        usename_not_string: {
          summary: 'Username is not a string',
          value: {
            errorsMessages: [
              {
                message: 'Username must be a string',
                field: 'username',
              },
            ],
          },
        },
        username_regexp: {
          summary: 'Username is not valid',
          value: {
            errorsMessages: [
              {
                message:
                  'Username must contain only letters, numbers, underscores, or hyphens',
                field: 'username',
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
        email_not_email: {
          summary: 'Email is not valid',
          value: {
            errorsMessages: [
              {
                message: 'The email must match the format example@example.com',
                field: 'email',
              },
            ],
          },
        },
        email_min_length: {
          summary: 'Email too short',
          value: {
            errorsMessages: [
              {
                message: 'Minimum number of characters 6',
                field: 'email',
              },
            ],
          },
        },
        email_max_length: {
          summary: 'Email too long',
          value: {
            errorsMessages: [
              {
                message: 'Maximum number of characters 100',
                field: 'email',
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
