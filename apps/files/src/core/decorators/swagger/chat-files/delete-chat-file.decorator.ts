import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';

export function ApiDeleteChatFile() {
  return applyDecorators(
    ApiSecurity('internal'),
    ApiOperation({
      summary: 'Delete chat file',
      description: 'Internal endpoint for deleting a chat file by its key.',
      operationId: 'deleteChatFile',
    }),
    ApiParam({
      name: 'fileKey',
      type: String,
      description: 'Chat file key/path',
      example: 'content/chats/123/123_image_1.png',
    }),
    ApiResponse({
      status: 200,
      description: 'Chat file successfully deleted',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Chat file deleted successfully',
          },
          fileKey: {
            type: 'string',
            example: 'content/chats/123/123_image_1.png',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found',
      examples: {
        chat_file_not_found: {
          summary: 'Chat file not found',
          value: {
            errorsMessages: [
              {
                message: 'Chat file not found',
                field: 'fileKey',
              },
            ],
          },
        },
      },
    }),
  );
}
