import { HttpStatus, applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import {
  chatErrorResponseSchema,
  chatMessageSchema,
} from './chat-swagger.schemas';

export function ApiGetChatMessages() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get private chat messages',
      description:
        'Returns paginated messages for the private chat between the actor and the specified recipient.',
      operationId: 'getChatMessages',
    }),
    ApiSecurity('internal'),
    ApiQuery({
      name: 'recipientId',
      required: true,
      type: Number,
      description: 'Recipient user ID',
      example: 12,
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Page size',
      example: 20,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Paginated chat history.',
      schema: {
        type: 'object',
        properties: {
          total: { type: 'number', example: 1 },
          page: { type: 'number', example: 1 },
          limit: { type: 'number', example: 20 },
          totalPages: { type: 'number', example: 1 },
          items: {
            type: 'array',
            items: chatMessageSchema,
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation failed or the actor queried themself.',
      schema: {
        ...chatErrorResponseSchema,
        example: {
          errorsMessages: [
            {
              message: 'You cannot chat with yourself',
              field: 'recipientId',
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Chat not found.',
      schema: {
        ...chatErrorResponseSchema,
        example: {
          errorsMessages: [
            {
              message: 'Chat not found',
              field: 'recipientId',
            },
          ],
        },
      },
    }),
  );
}
