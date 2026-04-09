import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PaginatedFollowingViewDto } from '@lumio/modules/user-follows/api/dto/output/following.paginated.view-dto';

export function ApiGetFollowing() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get current user following',
      description:
        'Returns paginated list of users that the current authenticated user follows',
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
  );
}
