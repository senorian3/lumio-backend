import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiGetChatFile() {
  return applyDecorators(
    ApiSecurity('internal'),
    ApiOperation({
      summary: 'Get chat file',
      description: 'Internal endpoint for retrieving chat file URL by its key.',
      operationId: 'getChatFile',
    }),
    ApiParam({
      name: 'fileKey',
      type: String,
      description: 'Chat file key/path',
      example: 'content/chats/123/123_image_1.png',
    }),
    ApiResponse({
      status: 200,
      description: 'Chat file successfully retrieved',
      schema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            example: 'content/chats/123/123_image_1.png',
          },
          url: {
            type: 'string',
            example:
              'https://s3.amazonaws.com/bucket/content/chats/123/123_image_1.png',
          },
        },
      },
    }),
  );
}
