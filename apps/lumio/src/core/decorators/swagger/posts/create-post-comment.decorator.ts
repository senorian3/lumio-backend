import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateCommentInputDto } from '@lumio/modules/posts/api/dto/create-comment.input-dto';

export function ApiCreatePostComment() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Create post comment',
      description:
        'Endpoint for creating a comment for a post. Supports optional parentId for replies.',
      operationId: 'createPostComment',
    }),

    ApiParam({
      name: 'postId',
      type: String,
      description: 'UUID of the post to comment',
      example: 'a16e733a-30a4-49c8-a923-61e34928aace',
      required: true,
    }),
    ApiBody({
      type: CreateCommentInputDto,
      examples: {
        root_comment: {
          summary: 'Create root comment',
          value: {
            content: 'Nice post',
          },
        },
        reply_comment: {
          summary: 'Create reply to comment',
          value: {
            content: 'I agree',
            parentId: 15,
          },
        },
      },
    }),

    ApiResponse({
      status: 201,
      description: 'Comment successfully created',
      examples: {
        success: {
          summary: 'Comment created',
          value: {
            id: 32,
            content: 'Nice post',
            likeCount: 0,
            dislikeCount: 0,
            createdAt: '2026-02-19T21:17:16.278Z',
            userId: 46,
            username: 'john_doe',
            avatarUrl: 'https://example.com/avatar.jpg',
            userReaction: 'none',
            replies: [],
          },
        },
      },
    }),

    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        empty_content: {
          summary: 'Comment content is empty',
          value: {
            errorsMessages: [
              {
                message: 'Comment cannot be empty',
                field: 'content',
              },
            ],
          },
        },
        content_too_long: {
          summary: 'Comment content is too long',
          value: {
            errorsMessages: [
              {
                message: 'Comment cannot be longer than 300 characters',
                field: 'content',
              },
            ],
          },
        },
        parent_comment_from_another_post: {
          summary: 'Parent comment does not belong to this post',
          value: {
            errorsMessages: [
              {
                message: 'Parent comment does not belong to this post',
                field: null,
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
        parent_comment_not_found: {
          summary: 'Parent comment not found or deleted',
          value: {
            errorsMessages: [
              {
                message: 'Parent comment not found or deleted',
                field: 'parentId',
              },
            ],
          },
        },
      },
    }),
  );
}
