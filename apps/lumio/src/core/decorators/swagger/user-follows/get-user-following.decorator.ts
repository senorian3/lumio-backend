import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PaginatedFollowingViewDto } from '@lumio/modules/user-follows/api/dto/output/following.paginated.view-dto';

export function ApiGetUserFollowing() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get following of specific user',
      description:
        'Returns paginated list of users that the specified user follows',
      operationId: 'getUserFollowing',
    }),
    ApiParam({
      name: 'userId',
      type: Number,
      description: 'User ID to get following list for',
      example: 1,
    }),
    ApiQuery({
      name: 'pageNumber',
      required: false,
      type: Number,
      description: 'Page number (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'pageSize',
      required: false,
      type: Number,
      description: 'Page size (default: 10)',
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Following list retrieved successfully',
      type: PaginatedFollowingViewDto,
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
      description: 'User not found',
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
