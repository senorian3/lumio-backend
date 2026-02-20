import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiDeleteUserAvatar() {
  return applyDecorators(
    ApiSecurity('internal'),
    ApiOperation({
      summary: 'Delete user avatar',
      description: 'Internal endpoint for deleting user avatar by userId.',
      operationId: 'deleteUserAvatar',
    }),
    ApiParam({
      name: 'userId',
      type: Number,
      description: 'User ID',
      example: 123,
    }),
    ApiResponse({
      status: 204,
      description: 'Avatar successfully deleted',
    }),
    ApiResponse({
      status: 404,
      description: 'Avatar not found',
      examples: {
        not_found: {
          summary: 'Avatar not found',
          value: {
            errorsMessages: [
              {
                message: 'Avatar not found',
                field: 'userId',
              },
            ],
          },
        },
      },
    }),
  );
}
