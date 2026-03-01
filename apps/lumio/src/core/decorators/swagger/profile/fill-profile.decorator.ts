import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiFillProfile() {
  return applyDecorators(
    ApiBearerAuth(),
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
        avatarUrl: 'https://i.pravatar.cc/150?u=alex_ivanov  ',
      },
    }),

    ApiResponse({
      status: 400,
      description: 'Validation error or business rule violation',
      examples: {
        validation_error_first_name_type: {
          summary: 'DTO validation failed (firstName type)',
          value: {
            errorsMessages: [
              {
                message: 'First name must be a string',
                field: 'firstName',
              },
            ],
          },
        },
        validation_error_first_name_min: {
          summary: 'DTO validation failed (firstName min length)',
          value: {
            errorsMessages: [
              {
                message: 'Minimum number of characters 1',
                field: 'firstName',
              },
            ],
          },
        },
        validation_error_first_name_max: {
          summary: 'DTO validation failed (firstName max length)',
          value: {
            errorsMessages: [
              {
                message: 'Maximum number of characters 100',
                field: 'firstName',
              },
            ],
          },
        },

        validation_error_last_name_type: {
          summary: 'DTO validation failed (lastName type)',
          value: {
            errorsMessages: [
              {
                message: 'Last name must be a string',
                field: 'lastName',
              },
            ],
          },
        },
        validation_error_last_name_min: {
          summary: 'DTO validation failed (lastName min length)',
          value: {
            errorsMessages: [
              {
                message: 'Minimum number of characters 1',
                field: 'lastName',
              },
            ],
          },
        },
        validation_error_last_name_max: {
          summary: 'DTO validation failed (lastName max length)',
          value: {
            errorsMessages: [
              {
                message: 'Maximum number of characters 100',
                field: 'lastName',
              },
            ],
          },
        },

        validation_error_date_of_birth_format: {
          summary: 'DTO validation failed (dateOfBirth format)',
          value: {
            errorsMessages: [
              {
                message: 'Date of birth must be a valid date',
                field: 'dateOfBirth',
              },
            ],
          },
        },
        validation_error_date_of_birth_age: {
          summary: 'DTO validation failed (dateOfBirth age)',
          value: {
            errorsMessages: [
              {
                message:
                  'A user under 13 cannot create a profile. <u>Privacy Policy</u>',
                field: 'dateOfBirth',
              },
            ],
          },
        },

        validation_error_country: {
          summary: 'DTO validation failed (country)',
          value: {
            errorsMessages: [
              {
                message: 'Country must be a string',
                field: 'country',
              },
            ],
          },
        },
        validation_error_country_max_length: {
          summary: 'DTO validation failed (country max length)',
          value: {
            errorsMessages: [
              {
                message: 'Maximum number of characters 100',
                field: 'country',
              },
            ],
          },
        },

        validation_error_city: {
          summary: 'DTO validation failed (city)',
          value: {
            errorsMessages: [
              {
                message: 'City must be a string',
                field: 'city',
              },
            ],
          },
        },
        validation_error_city_max_length: {
          summary: 'DTO validation failed (city max length)',
          value: {
            errorsMessages: [
              {
                message: 'Maximum number of characters 100',
                field: 'city',
              },
            ],
          },
        },

        validation_error_about_me: {
          summary: 'DTO validation failed (aboutMe)',
          value: {
            errorsMessages: [
              {
                message: 'About me must be a string',
                field: 'aboutMe',
              },
            ],
          },
        },
        validation_error_about_me_max_length: {
          summary: 'DTO validation failed (aboutMe max length)',
          value: {
            errorsMessages: [
              {
                message: 'Maximum number of characters 200',
                field: 'aboutMe',
              },
            ],
          },
        },

        profile_already_filled: {
          summary: 'User already filled profile',
          value: {
            errorsMessages: [
              {
                message: 'Profile already filled',
                field: 'profileFilled',
              },
            ],
          },
        },
      },
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

    ApiResponse({
      status: 404,
      description: 'User not found',
      examples: {
        user_not_found: {
          summary: 'User does not exist',
          value: {
            errorsMessages: [
              {
                message: 'User is not found',
                field: 'userId',
              },
            ],
          },
        },
      },
    }),
  );
}
