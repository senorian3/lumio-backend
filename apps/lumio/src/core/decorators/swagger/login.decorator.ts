import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'User login',
      description: 'Endpoint for user login',
      operationId: 'loginUser',
    }),

    ApiResponse({
      status: 200,
      description: 'User successfully login via github',
      example: {
        accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
      },
      headers: {
        'Set-Cookie': {
          description: 'HTTP-only refresh token cookie',
          schema: {
            type: 'string',
            example: 'refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
          },
        },
      },
    }),

    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        password_min_length: {
          summary: 'Password too short',
          value: {
            errorMessages: [
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
            errorMessages: [
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
            errorMessages: [
              {
                message: 'Password must be a string',
                field: 'password',
              },
            ],
          },
        },
        password_regexp: {
          summary: 'Password is not valid',
          value: {
            errorMessages: [
              {
                message:
                  'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                field: 'password',
              },
            ],
          },
        },
        email_not_email: {
          summary: 'Email is not valid',
          value: {
            errorMessages: [
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
            errorMessages: [
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
            errorMessages: [
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
      status: 403,
      description: 'Forbidden access',
      examples: {
        email_not_registered: {
          summary: 'Email is not registered',
          value: {
            errorsMessages: [
              {
                message: 'The email must match the format example@example.com',
                field: 'email',
              },
            ],
          },
        },
        wrong_password: {
          summary: 'Wrong password',
          value: {
            errorsMessages: [
              {
                message: 'The email must match the format example@example.com',
                field: 'email',
              },
            ],
          },
        },
        iat_or_exp_not_verified: {
          summary: 'Refresh token is not verified',
          value: {
            errorsMessages: [
              {
                message: 'Refresh token is not verified',
                field: 'refreshToken',
              },
            ],
          },
        },
        user_not_confirmed: {
          summary: 'User account is not confirmed',
          value: {
            errorsMessages: [
              {
                message: 'User account is not confirmed',
                field: 'confirmCode',
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
