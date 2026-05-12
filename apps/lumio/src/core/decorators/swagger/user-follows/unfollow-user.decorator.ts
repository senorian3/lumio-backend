import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

export function ApiUnfollowUser() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Unfollow a user',
      description:
        'Endpoint for unfollowing a previously followed user. Returns updated follow status with counts.',
      operationId: 'unfollowUser',
    }),
    ApiParam({
      name: 'userId',
      description: 'ID of the user to unfollow',
      required: true,
      type: Number,
      example: 456,
    }),
    ApiResponse({
      status: 200,
      description: 'Successfully unfollowed the user',
      examples: {
        success: {
          summary: 'Follow status after unfollowing',
          value: {
            isFollowing: false,
            followersCount: 150,
            followingCount: 85,
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
        cannot_unfollow_self: {
          summary: 'Cannot unfollow yourself',
          value: {
            errorsMessages: [
              {
                message: 'Cannot unfollow yourself',
                field: 'followingId',
              },
            ],
          },
        },
        not_following: {
          summary: 'Not following this user',
          value: {
            errorsMessages: [
              {
                message: 'Not following this user',
                field: 'followingId',
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Profile not filled',
      examples: {
        profile_not_filled: {
          summary: 'User profile is not filled',
          value: {
            errorsMessages: [
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
          summary: 'User to unfollow does not exist',
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
