import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { LikeCommentInputDto } from '@lumio/modules/posts/api/dto/input/like-comment.input.dto';

export function ApiLikeComment() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Like comment',
      description:
        'Endpoint for setting current user reaction to a comment. Use none to remove reaction.',
      operationId: 'likeComment',
    }),

    ApiParam({
      name: 'commentId',
      type: Number,
      description: 'ID of the comment',
      example: 32,
      required: true,
    }),
    ApiBody({
      type: LikeCommentInputDto,
      examples: {
        like: {
          summary: 'Set like',
          value: {
            status: 'like',
          },
        },
        dislike: {
          summary: 'Set dislike',
          value: {
            status: 'dislike',
          },
        },
        none: {
          summary: 'Remove reaction',
          value: {
            status: 'none',
          },
        },
      },
    }),

    ApiResponse({
      status: 200,
      description: 'Comment reaction successfully updated',
    }),

    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        invalid_status: {
          summary: 'Invalid reaction status',
          value: {
            errorsMessages: [
              {
                message: 'Status must be "like", "dislike" or "none"',
                field: 'status',
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
        invalid_user_data: {
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
          summary: "User doesn't have active session",
          value: {
            errorsMessages: [
              {
                message: "User doesn't have active session",
                field: 'session',
              },
            ],
          },
        },
        token_version_mismatch: {
          summary: 'Token version mismatch - token is invalidated',
          value: {
            errorsMessages: [
              {
                message: 'Token version mismatch - token is invalidated',
                field: 'tokenVersion',
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
        comment_not_found: {
          summary: 'Comment not found or deleted',
          value: {
            errorsMessages: [
              {
                message: 'Comment not found or deleted',
                field: 'commentId',
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
