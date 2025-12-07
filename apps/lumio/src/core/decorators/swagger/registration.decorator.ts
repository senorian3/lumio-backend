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
      status: 204,
      description: 'User successfully registered',
    }),

    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        user_already_registered: {
          summary: 'User already registered',
          value: {
            extensions: [
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
            extensions: [
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
            extensions: [
              {
                message: 'Email confirmation not found',
                field: 'emailConfirmation',
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
        extensions: [
          {
            errorsMessages: [
              {
                message: 'Too many requests',
              },
            ],
          },
        ],
      },
    }),
  );
}
