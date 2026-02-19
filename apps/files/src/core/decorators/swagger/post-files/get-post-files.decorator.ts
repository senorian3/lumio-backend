import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiGetPostFiles() {
  return applyDecorators(
    ApiSecurity('internal'),
    ApiOperation({
      summary: 'Get post files by post IDs',
      description:
        'Internal endpoint for retrieving files for multiple posts by their IDs.',
      operationId: 'getPostFiles',
    }),
    ApiBody({
      description: 'Post IDs to retrieve files for',
      schema: {
        type: 'object',
        properties: {
          postIds: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array of post IDs',
            example: ['post-uuid-1', 'post-uuid-2'],
          },
        },
        required: ['postIds'],
      },
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
  );
}
