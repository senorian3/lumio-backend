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
        extensions: [
          {
            message: 'Minimum number of characters 6; Received value: ',
            field: 'email',
          },
        ],
      },
    }),
  );
}
