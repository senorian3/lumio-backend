import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiLoginization() {
  return applyDecorators(
    ApiOperation({
      summary: 'User login',
      description: 'Endpoint for user loginization',
      operationId: 'loginUser',
    }),

    ApiResponse({
      status: 200,
      description: 'User successfully logined',
    }),

    ApiResponse({
      status: 403,
      description: 'Validation error',
      example: {
        message: 'Forbidden',
        code: 'FORBIDDEN',
        extensions: [
          {
            message: 'The email must match the format example@example.com',
            field: 'email',
          },
        ],
      },
    }),
  );
}
