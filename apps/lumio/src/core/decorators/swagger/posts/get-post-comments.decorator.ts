import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CommentSortField } from '@lumio/modules/posts/api/dto/input/get-post-comments.query.dto';
import { SortDirection } from '@libs/core/dto/pagination/base.query-params.input-dto';

export function ApiGetPostComments() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get post comments',
      description:
        'Endpoint for retrieving paginated comments for a post. Access token is optional and adds userReaction to comments.',
      operationId: 'getPostComments',
    }),

    ApiParam({
      name: 'postId',
      type: String,
      description: 'UUID of the post',
      example: 'a16e733a-30a4-49c8-a923-61e34928aace',
      required: true,
    }),
    ApiQuery({
      name: 'pageNumber',
      type: Number,
      description: 'Page number',
      example: 1,
      required: false,
    }),
    ApiQuery({
      name: 'pageSize',
      type: Number,
      description: 'Page size',
      example: 20,
      required: false,
    }),
    ApiQuery({
      name: 'sortBy',
      enum: CommentSortField,
      description: 'Comment sort field',
      example: CommentSortField.CreatedAt,
      required: false,
    }),
    ApiQuery({
      name: 'sortDirection',
      enum: SortDirection,
      description: 'Sort direction',
      example: SortDirection.Desc,
      required: false,
    }),

    ApiResponse({
      status: 200,
      description: 'Post comments successfully fetched',
      examples: {
        success: {
          summary: 'Post comments page',
          value: {
            pagesCount: 1,
            page: 1,
            pageSize: 20,
            totalCount: 1,
            items: [
              {
                id: 32,
                content: 'Nice post',
                likeCount: 3,
                dislikeCount: 0,
                createdAt: '2026-02-19T21:17:16.278Z',
                userId: 46,
                username: 'john_doe',
                avatarUrl: 'https://example.com/avatar.jpg',
                userReaction: 'like',
                replies: [
                  {
                    id: 33,
                    content: 'I agree',
                    likeCount: 1,
                    dislikeCount: 0,
                    createdAt: '2026-02-19T21:19:16.278Z',
                    userId: 47,
                    username: 'jane_doe',
                    avatarUrl: null,
                    userReaction: 'none',
                    replies: [],
                  },
                ],
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
        post_not_found: {
          summary: 'Post not found',
          value: {
            errorsMessages: [
              {
                message: 'Post not found',
                field: 'postId',
              },
            ],
          },
        },
      },
    }),
  );
}
