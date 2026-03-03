import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetCurrentUser() {
  return applyDecorators(
    ApiBearerAuth(),

    ApiOperation({
      summary: 'Get the profile of the current user',
      description:
        'Returns basic information about the current authorized user',
      operationId: 'getCurrentProfile',
    }),

    ApiResponse({
      status: 200,
      description: 'Successful receipt of user data',
      examples: {
        user_get_me_successful: {
          summary: 'User successfully received',
          value: {
            userId: 123,
            username: 'alex_ivanov',
            email: 'alex.ivanov@example.com',
          },
        },
      },
    }),

    ApiResponse({
      status: 401,
      description: 'Unauthorized - Authentication failed or session invalid',
      examples: {
        no_access_token: {
          summary: 'No access token in request',
          value: {
            errorsMessages: [],
          },
        },
        invalid_jwt_data: {
          summary: 'Invalid user data inside JWT',
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
          summary: 'No active session found',
          value: {
            errorsMessages: [
              {
                message: "User doesn't have active session",
                field: 'session',
              },
            ],
          },
        },
        token_version_mismatch: {
          summary: 'Token invalidated',
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
      status: 429,
      description: 'Too many requests',
      examples: {
        too_many_requests: {
          summary: 'Too many requests',
          value: {
            errorsMessages: [
              {
                message: 'Too many requests',
                field: null,
              },
            ],
          },
        },
      },
    }),
  );
}
