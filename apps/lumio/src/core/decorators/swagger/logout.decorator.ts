import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiLogoutization() {
  return applyDecorators(
    ApiOperation({
      summary: 'User login',
      description: 'Endpoint for user loginization',
      operationId: 'loginUser',
    }),

    ApiResponse({
      status: 204,
      description: 'User successfully logouted',
    }),
  );
}
