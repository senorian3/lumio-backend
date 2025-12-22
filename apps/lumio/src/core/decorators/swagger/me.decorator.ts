import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetCurrentUser() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get the profile of the current user',
      description:
        'Returns basic information about the current authorized user',
      operationId: 'getCurrentUserProfile',
    }),
    ApiResponse({
      status: 200,
      description: 'Successful receipt of user data',
      schema: {
        example: {
          userId: 123,
          username: 'alex_ivanov',
          email: 'alex.ivanov@example.com',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
      schema: {
        example: {
          errorsMessages: [
            {
              message: 'There is no access token in request',
              field: 'accessToken',
            },
          ],
        },
      },
    }),
  );
}
