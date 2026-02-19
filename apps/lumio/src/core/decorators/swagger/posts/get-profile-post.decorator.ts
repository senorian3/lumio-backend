import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetProfilePost() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get profile post of user',
      description: 'Endpoint for get profile post of user',
      operationId: 'getProfilePost',
    }),

    ApiResponse({
      status: 200,
      description: 'Profile post successfully fetched',
      examples: {
        get_post: {
          summary: 'Example response for post',
          value: {
            id: 1,
            description: 'Test post',
            createdAt: '2026-01-10T20:23:35.435Z',
            userId: 46,
            postFiles: [
              {
                id: 1,
                url: 'https://example.com/file1.jpg',
                postId: 1,
              },
              {
                id: 2,
                url: 'https://example.com/file2.jpg',
                postId: 1,
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
        not_found_user: {
          summary: 'Profile is not found',
          value: {
            errorsMessages: [
              {
                message: 'Profile is not found',
                field: 'userId',
              },
            ],
          },
        },
        not_found_post: {
          summary: 'Post is not found',
          value: {
            errorsMessages: [
              {
                message: 'Post is not found',
                field: 'postId',
              },
            ],
          },
        },
      },
    }),
  );
}
