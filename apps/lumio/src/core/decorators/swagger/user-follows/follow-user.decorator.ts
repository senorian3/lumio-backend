import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

export function ApiFollowUser() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Follow a user',
      description:
        'Endpoint for following another user. Returns updated follow status with counts.',
      operationId: 'followUser',
    }),
    ApiParam({
      name: 'userId',
      description: 'ID of the user to follow',
      required: true,
      type: Number,
      example: 456,
    }),
    ApiResponse({
      status: 201,
      description: 'Successfully followed the user',
      examples: {
        success: {
          summary: 'Follow status after following',
          value: {
            isFollowing: true,
            followersCount: 151,
            followingCount: 86,
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
        cannot_follow_self: {
          summary: 'Cannot follow yourself',
          value: {
            errorsMessages: [
              {
                message: 'Cannot follow yourself',
                field: 'followingId',
              },
            ],
          },
        },
        already_following: {
          summary: 'Already following this user',
          value: {
            errorsMessages: [
              {
                message: 'Already following this user',
                field: 'followingId',
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
          summary: 'User to follow does not exist',
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
