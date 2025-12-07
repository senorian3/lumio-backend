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
      example: {
        message: 'Bad Request',
        code: 'BAD_REQUEST',
        extensions: [
          {
            message: 'User with this email is already registered',
            field: 'email',
          },
        ],
      },
    }),
  );
}
