import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { LikePostInputDto } from '@lumio/modules/posts/api/dto/input/like-post.input.dto';

export function ApiLikePost() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Like post',
      description:
        'Endpoint for setting current user reaction to a post. Use none to remove reaction.',
      operationId: 'likePost',
    }),

    ApiParam({
      name: 'postId',
      type: String,
      description: 'UUID of the post',
      example: 'a16e733a-30a4-49c8-a923-61e34928aace',
      required: true,
    }),
    ApiBody({
      type: LikePostInputDto,
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
      description: 'Post reaction successfully updated',
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
        post_not_found: {
          summary: 'Post not found or deleted',
          value: {
            errorsMessages: [
              {
                message: 'Post not found or deleted',
                field: 'postId',
              },
            ],
          },
        },
      },
    }),
  );
}
