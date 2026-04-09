import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PaginatedFollowersViewDto } from '@lumio/modules/user-follows/api/dto/output/followers.paginated.view-dto';

export function ApiGetUserFollowers() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get followers of specific user',
      description:
        'Returns paginated list of users who follow the specified user',
    }),
    ApiParam({
      name: 'userId',
      type: Number,
      description: 'User ID to get followers for',
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
      description: 'Followers retrieved successfully',
      type: PaginatedFollowersViewDto,
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
