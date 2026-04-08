import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PaginatedFollowersViewDto } from '@lumio/modules/user-follows/api/dto/output/followers.paginated.view-dto';

export function ApiGetFollowers() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get current user followers',
      description:
        'Returns paginated list of users who follow the current authenticated user',
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
  );
}
