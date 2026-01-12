import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetProfile() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get profile of user',
      description: 'Endpoint for get profile of use',
      operationId: 'getProfile',
    }),

    ApiResponse({
      status: 200,
      description: 'Profile successfully fetched',
      examples: {
        get_profile: {
          summary: 'Example response for profile',
          value: {
            id: 46,
            username: 'alex_ivanov',
            firstName: 'Ivan',
            lastName: 'Ivanov',
            dateOfBirth: '23.03.2000',
            country: 'Russia',
            city: 'Moscow',
            aboutMe: 'About me',
            avatarUrl: 'https://i.pravatar.cc/150?u=alex_ivanov',
          },
        },
      },
    }),

    ApiResponse({
      status: 404,
      description: 'Not found',
      examples: {
        not_found_user: {
          summary: 'Profile is not found',
          value: {
            errorMessages: [
              {
                message: 'Profile is not found',
                field: 'userId',
              },
            ],
          },
        },
      },
    }),
  );
}
