import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { InputGetUserPostsDto } from '@files/modules/post-files/api/dto/input/get-user-post.input.dto';

export function ApiGetPostFiles() {
  return applyDecorators(
    ApiSecurity('internal'),
    ApiOperation({
      summary: 'Get post files by post IDs',
      description:
        'Internal endpoint for retrieving files for multiple posts by their IDs. Note: This endpoint uses GET with request body, which is non-standard but accepted for internal APIs.',
      operationId: 'getPostFiles',
    }),
    ApiBody({
      type: InputGetUserPostsDto,
      description: 'Post IDs to retrieve files for',
    }),
    ApiResponse({
      status: 200,
      description: 'Files retrieved successfully',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            url: { type: 'string' },
            postId: { type: 'string' },
          },
        },
        example: [
          {
            id: 1,
            url: 'https://lumio-files-photo.storage.yandexcloud.net/content/posts/uuid1/image1.jpg',
            postId: 'post-uuid-1',
          },
        ],
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
      examples: {
        invalid_post_ids: {
          summary: 'Invalid post IDs format',
          value: {
            errorsMessages: [
              {
                message: 'postIds must be an array',
                field: 'postIds',
              },
            ],
          },
        },
      },
    }),
  );
}
