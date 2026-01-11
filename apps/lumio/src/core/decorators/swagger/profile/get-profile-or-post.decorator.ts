import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetProfileOrPost() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get profile or post of user',
      description: 'Endpoint for get porifle or post of user(profile)',
      operationId: 'getProfileOrPost',
    }),

    ApiResponse({
      status: 200,
      description: 'Profile or post successfully fetched',
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
        get_post: {
          summary: 'Example response for post',
          value: {
            id: 1,
            description: 'Test post',
            createdAt: '2026-01-10T20:23:35.435Z',
            userId: 46,
            postFiles: [
              {
                id: 1,
                url: 'https://example.com/file1.jpg',
                postId: 1,
              },
              {
                id: 2,
                url: 'https://example.com/file2.jpg',
                postId: 1,
              },
            ],
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
        not_found_post: {
          summary: 'Post is not found',
          value: {
            errorMessages: [
              {
                message: 'Post is not found',
                field: 'postId',
              },
            ],
          },
        },
      },
    }),
  );
}
