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
      example: 1,
    }),
    ApiQuery({
      name: 'pageSize',
      required: false,
      type: Number,
      description: 'Number of posts per page (default 4)',
      example: 4,
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
              id: 'a16e733a-30a4-49c8-a923-61e34928aace',
              description: 'Мой первый пост',
              createdAt: '2026-01-08T07:16:03.016Z',
              userId: 46,
              likeCount: 12,
              dislikeCount: 2,
              userReaction: 'none',
              postFiles: [
                {
                  id: 65,
                  url: 'https://i.pravatar.cc/150?u=alex_ivanov  ',
                  postId: 'a16e733a-30a4-49c8-a923-61e34928aace',
                  createdAt: '2026-01-08T07:16:03.120Z',
                },
              ],
              newestLikes: [
                {
                  userId: 51,
                  username: 'jane_doe',
                  avatarUrl: 'https://example.com/avatar.jpg',
                  addedAt: '2026-01-08T08:16:03.016Z',
                },
              ],
            },
          ],
        },
        allRegisteredUsersCount: 1,
      },
    }),

    ApiResponse({
      status: 429,
      description: 'Too Many Requests - Rate limit exceeded',
      examples: {
        rate_limit_exceeded: {
          summary: 'Too many requests',
          value: {
            errorsMessages: [
              {
                message: 'Too many requests',
                field: 'rateLimit',
              },
            ],
          },
        },
      },
    }),
  );
}
