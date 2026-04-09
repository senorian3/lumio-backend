import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PaginatedFollowingViewDto } from '@lumio/modules/user-follows/api/dto/output/following.paginated.view-dto';

export function ApiGetUserFollowing() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get following of specific user',
      description:
        'Returns paginated list of users that the specified user follows',
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
    }),
    ApiQuery({
      name: 'pageSize',
      required: false,
      type: Number,
      description: 'Page size (default: 10)',
    }),
    ApiResponse({
      status: 200,
      description: 'Following list retrieved successfully',
      type: PaginatedFollowingViewDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
    }),
  );
}
