import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

export function ApiFillProfile() {
  return applyDecorators(
    ApiSecurity('bearer'),
    ApiOperation({
      summary: 'Fill profile',
      description: 'Endpoint for fill profile',
      operationId: 'fillProfile',
    }),

    ApiResponse({
      status: 200,
      description: 'Profile successfully filled',
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
            errorsMessages: [
              {
                message: 'User is not found',
                field: 'userId',
              },
            ],
          },
        },
        user_already_filled: {
          summary: 'User already filled profile',
          value: {
            errorsMessages: [
              {
                message: 'User already filled profile',
                field: 'userId',
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
      status: 403,
      description: 'Forbidden',
      examples: {
        user_doesnt_own_profile: {
          summary: 'Profile does not belong to the user',
          value: {
            errorsMessages: [
              {
                message: 'User cannot fill profile for another user',
                field: 'userId',
              },
            ],
          },
        },
      },
    }),
  );
}
