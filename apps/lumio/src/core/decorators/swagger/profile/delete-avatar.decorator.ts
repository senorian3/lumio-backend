import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiDeleteUserAvatar() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Delete user avatar',
      description:
        'Endpoint for deleting a user profile avatar. Removes avatar from database and S3 storage.',
      operationId: 'deleteUserAvatar',
    }),
    ApiResponse({
      status: 204,
      description: 'Avatar successfully deleted',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - invalid token or session',
      examples: {
        no_access_token: {
          summary: 'No access token in request',
          value: {
            errorsMessages: [],
          },
        },
        invalid_user_data: {
          summary: 'Invalid user data in JWT',
          value: {
            errorsMessages: [
              {
                message: 'Invalid user data in JWT',
                field: 'user',
              },
            ],
          },
        },
        no_active_session: {
          summary: "User doesn't have active session",
          value: {
            errorsMessages: [
              {
                message: "User doesn't have active session",
                field: 'session',
              },
            ],
          },
        },
        expired_token: {
          summary: 'Token version is expired',
          value: {
            errorsMessages: [
              {
                message: 'Token version mismatch - token is invalidated',
                field: 'tokenVersion',
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
      examples: {
        user_not_found: {
          summary: 'User does not exist',
          value: {
            errorsMessages: [
              { message: 'User does not exist', field: 'userId' },
            ],
          },
        },
      },
    }),
  );
}
