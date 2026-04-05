import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

export function ApiSearchUsers() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Search users by username',
      description:
        'Endpoint for searching users by username with pagination. Returns paginated list of users with follow status.',
      operationId: 'searchUsers',
    }),
    ApiQuery({
      name: 'username',
      description: 'Username to search for (3-40 characters)',
      required: true,
      type: String,
      example: 'john',
    }),
    ApiQuery({
      name: 'page',
      description: 'Page number for pagination',
      required: false,
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      description: 'Number of items per page',
      required: false,
      type: Number,
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Users found successfully',
      examples: {
        success: {
          summary: 'Paginated users list',
          value: {
            items: [
              {
                id: 1,
                username: 'john_doe',
                avatarUrl: 'https://example.com/avatar.jpg',
                isFollowing: true,
              },
              {
                id: 2,
                username: 'jane_smith',
                avatarUrl: 'https://example.com/avatar2.jpg',
                isFollowing: false,
              },
            ],
            totalCount: 2,
            pagesCount: 1,
            page: 1,
            pageSize: 10,
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        username_too_short: {
          summary: 'Username too short',
          value: {
            errorsMessages: [
              {
                message: 'Username must be at least 3 characters',
                field: 'username',
              },
            ],
          },
        },
        username_too_long: {
          summary: 'Username too long',
          value: {
            errorsMessages: [
              {
                message: 'Username must be at most 40 characters',
                field: 'username',
              },
            ],
          },
        },
        invalid_page: {
          summary: 'Invalid page number',
          value: {
            errorsMessages: [
              {
                message: 'Page must be at least 1',
                field: 'page',
              },
            ],
          },
        },
        invalid_limit: {
          summary: 'Invalid limit value',
          value: {
            errorsMessages: [
              {
                message: 'Limit must be between 1 and 100',
                field: 'limit',
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
