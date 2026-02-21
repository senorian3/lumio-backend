import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

export function ApiGetProfilePost() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get profile post of user',
      description: 'Endpoint for get profile post of user',
      operationId: 'getProfilePost',
    }),

    ApiParam({
      name: 'userId',
      type: Number,
      description: 'ID of the user',
      example: 46,
    }),
    ApiQuery({
      name: 'postId',
      type: String,
      description: 'ID of the post',
      required: true,
      example: '1',
    }),

    ApiResponse({
      status: 200,
      description: 'Profile post successfully fetched',
      examples: {
        get_post: {
          summary: 'Example response for post',
          value: {
            id: 'a16e733a-30a4-49c8-a923-61e34928aace',
            description: 'Test post',
            createdAt: '2026-01-10T20:23:35.435Z',
            userId: 46,
            postFiles: [
              {
                id: 1,
                url: 'https://example.com/file1.jpg',
                postId: 1,
              },
            ],
          },
        },
      },
    }),

    ApiResponse({
      status: 400,
      description: 'Validation error (e.g., invalid userId format)',
      examples: {
        invalid_id_format: {
          summary: 'UserId is not a valid number',
          value: {
            errorsMessages: [],
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
