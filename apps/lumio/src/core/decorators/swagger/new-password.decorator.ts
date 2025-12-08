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
      status: 204,
      description: 'User create new password successfully',
    }),

    ApiResponse({
      status: 400,
      description: 'User does not exist',
      example: {
        extensions: [
          {
            errorsMessages: [
              {
                message: 'User does not exist',
                field: 'code',
              },
            ],
          },
        ],
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
