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
      description: 'Unauthorized',
      examples: {
        no_access_token: {
          summary: 'No access token in request',
          value: {
            errorMessages: [
              {
                message: 'There is no access token in request',
                field: 'accessToken',
              },
            ],
          },
        },
      },
    }),
  );
}
