import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

export function ApiUpdateProfile() {
  return applyDecorators(
    ApiSecurity('bearer'),
    ApiOperation({
      summary: 'Update profile',
      description: 'Endpoint for update profile',
      operationId: 'updateProfile',
    }),

    ApiResponse({
      status: 200,
      description: 'Profile successfully updated',
      example: {
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
    }),

    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        user_not_found: {
          summary: 'User is not found',
          value: {
            errorMessages: [
              {
                message: 'User is not found',
                field: 'userId',
              },
            ],
          },
        },
        user_profile_is_not_filled: {
          summary: 'User profile is not filled',
          value: {
            errorMessages: [
              {
                message: 'Profile is not filled',
                field: 'profileFilled',
              },
            ],
          },
        },
      },
    }),

    ApiResponse({
      status: 401,
      description: 'Unauthorized',
      examples: {
        expired_token_version: {
          summary: 'Token version is expired',
          value: {
            errorMessages: [
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
      status: 403,
      description: 'Forbidden',
      examples: {
        user_doesnt_own_profile: {
          summary: 'Profile does not belong to the user',
          value: {
            errorMessages: [
              {
                message: 'User cannot update another user profile',
                field: 'userId',
              },
            ],
          },
        },
      },
    }),
  );
}
