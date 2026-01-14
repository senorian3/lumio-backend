import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiGetMainPage() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get main page information',
      description:
        'Endpoint for get main page information with paginated posts',
      operationId: 'getMainPage',
    }),

    ApiQuery({
      name: 'pageNumber',
      required: false,
      type: Number,
      description: 'Page number (starts from 1)',
    }),
    ApiQuery({
      name: 'pageSize',
      required: false,
      type: Number,
      description: 'Number of posts per page (default 4)',
    }),

    ApiResponse({
      status: 200,
      description: 'Main page information successfully fetched',
      example: {
        posts: {
          pagesCount: 1,
          page: 1,
          pageSize: 4,
          totalCount: 1,
          items: [
            {
              id: 65,
              description: 'Мой первый пост',
              createdAt: '2026-01-08T07:16:03.016Z',
              userId: 46,
              postFiles: [
                {
                  id: 65,
                  url: 'https://i.pravatar.cc/150?u=alex_ivanov',
                  postId: 65,
                },
              ],
            },
          ],
        },
        allRegisteredUsersCount: 1,
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        files_not_found: {
          summary: 'Failed to fetch files',
          value: {
            errorMessages: [
              {
                message: 'Failed to fetch files',
                field: 'files',
              },
            ],
          },
        },
      },
    }),
  );
}
