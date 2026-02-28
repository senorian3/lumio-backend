import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

export function ApiGetProfilePost() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get profile post of user',
      description:
        'Endpoint for get profile post of user by profileId and postId',
      operationId: 'getProfilePost',
    }),

    ApiParam({
      name: 'profileId',
      type: Number,
      description: 'ID of the profile',
      example: 46,
    }),
    ApiQuery({
      name: 'postId',
      type: String,
      description: 'UUID of the post',
      required: true,
      example: 'a16e733a-30a4-49c8-a923-61e34928aace',
    }),

    ApiResponse({
      status: 200,
      description: 'Profile post successfully fetched',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: 'a16e733a-30a4-49c8-a923-61e34928aace',
          },
          description: { type: 'string', example: 'Test post' },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-10T20:23:35.435Z',
          },
          userId: { type: 'integer', example: 46 },
          postFiles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                url: {
                  type: 'string',
                  format: 'uri',
                  example: 'https://example.com/file1.jpg',
                },
                postId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'a16e733a-30a4-49c8-a923-61e34928aace',
                },
              },
            },
          },
        },
      },
    }),

    ApiResponse({
      status: 404,
      description: 'Not found',
      examples: {
        not_found_profile: {
          summary: 'Profile is not found',
          value: {
            errorsMessages: [
              {
                message: 'Profile is not found',
                field: 'profileId',
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
        not_found_user: {
          summary: 'User is not found',
          value: {
            errorsMessages: [
              {
                message: 'User is not found',
                field: 'profileId',
              },
            ],
          },
        },
      },
    }),
  );
}
