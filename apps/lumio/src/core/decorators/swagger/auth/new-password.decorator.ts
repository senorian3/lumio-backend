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
            errorMessages: [
              {
                message: 'User does not exist',
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
