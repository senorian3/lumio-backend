import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

export function ApiGetUserProfile() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get user profile',
      description:
        'Endpoint for getting detailed user profile information. ' +
        'Available for both authorized and unauthorized users. ' +
        'For unauthorized users isFollowing and isCurrentUser will be false.',
      operationId: 'getUserProfile',
    }),
    ApiParam({
      name: 'userId',
      description: 'ID of the user whose profile to retrieve',
      required: true,
      type: Number,
      example: 123,
    }),
    ApiResponse({
      status: 200,
      description: 'User profile retrieved successfully',
      examples: {
        authorized: {
          summary: 'Authorized user - with follow status',
          value: {
            id: 123,
            username: 'john_doe',
            avatarUrl: 'https://example.com/avatar.jpg',
            aboutMe: 'Software developer from New York',
            followersCount: 150,
            followingCount: 85,
            postsCount: 42,
            isFollowing: true,
            isCurrentUser: false,
          },
        },
        unauthorized: {
          summary: 'Unauthorized user - no follow status',
          value: {
            id: 123,
            username: 'john_doe',
            avatarUrl: 'https://example.com/avatar.jpg',
            aboutMe: 'Software developer from New York',
            followersCount: 150,
            followingCount: 85,
            postsCount: 42,
            isFollowing: false,
            isCurrentUser: false,
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
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
      status: 401,
      description: 'Unauthorized',
      examples: {
        no_access_token: {
          summary: 'No access token in request',
          value: {
            errorsMessages: [],
          },
        },
        token_version_mismatch: {
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
        invalid_jwt_data: {
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
          summary: 'User does not have active session',
          value: {
            errorsMessages: [
              {
                message: "User doesn't have active session",
                field: 'session',
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
        user_not_found: {
          summary: 'User does not exist',
          value: {
            errorsMessages: [
              {
                message: 'User does not exist',
                field: 'userId',
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
