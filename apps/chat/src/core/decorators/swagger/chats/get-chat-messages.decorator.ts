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
        'Returns cursor-paginated messages for the private chat between the actor and the specified recipient. Messages are always sorted from newest to oldest.',
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
      name: 'cursor',
      required: false,
      type: String,
      description:
        'Cursor message ID (UUID) for pagination. Omit to fetch the latest messages.',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of messages to retrieve per page',
      example: 20,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      description: 'Successfully retrieved paginated chat messages.',
      schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: chatMessageSchema,
          },
          nextCursor: {
            type: 'string',
            nullable: true,
            example: '587844aa-dddc-4fc5-821b-6574346391fa',
            description:
              'ID of the last message in the current page. Pass this as `cursor` to load older messages. `null` when no more messages exist.',
          },
          totalCount: {
            type: 'number',
            example: 6,
            description: 'Total number of non-deleted messages in the chat',
          },
          limit: {
            type: 'number',
            example: 3,
          },
          currentCursor: {
            type: 'string',
            nullable: true,
            example: null,
            description: 'The cursor used in the current request (echoed back)',
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
      description: 'Chat not found or actor is not a participant.',
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
