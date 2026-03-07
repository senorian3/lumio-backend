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
      status: 400,
      description: 'Bad Request',
      examples: {
        invalid_user_id: {
          summary: 'Invalid user ID format',
          value: {
            errorsMessages: [
              {
                message: 'User ID must be a valid number',
                field: 'userId',
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found',
      examples: {
        avatar_not_found: {
          summary: 'Avatar not found',
          value: {
            errorsMessages: [
              {
                message: 'Avatar is not found',
                field: 'avatar',
              },
            ],
          },
        },
        user_not_found: {
          summary: 'User not found',
          value: {
            errorsMessages: [
              {
                message: 'User not found',
                field: 'userId',
              },
            ],
          },
        },
      },
    }),
  );
}
