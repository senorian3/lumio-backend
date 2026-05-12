import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { PaginatedFollowersViewDto } from '@lumio/modules/user-follows/api/dto/output/followers.paginated.view-dto';

export function ApiGetFollowers() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get current user followers',
      description:
        'Returns paginated list of users who follow the current authenticated user',
      operationId: 'getFollowers',
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
      description: 'Followers retrieved successfully',
      type: PaginatedFollowersViewDto,
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
