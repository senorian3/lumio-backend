import { HttpStatus, applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { chatErrorResponseSchema } from './chat-swagger.schemas';

export function ApiMarkChatMessageRead() {
  return applyDecorators(
    ApiOperation({
      summary: 'Mark a message as read',
      description:
        'Marks a single message as read for the actor if the actor is the recipient.',
      operationId: 'markChatMessageAsRead',
    }),
    ApiSecurity('internal'),
    ApiParam({
      name: 'messageId',
      description: 'Message identifier',
      example: '8c9e1671-9f3c-493f-a8df-8a8e8e8c8e8e',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Message read status updated.',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Message marked as read',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation failed.',
      schema: {
        ...chatErrorResponseSchema,
        example: {
          errorsMessages: [
            {
              message: 'Invalid messageId format',
              field: 'messageId',
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Message not found or already read.',
      schema: {
        ...chatErrorResponseSchema,
        example: {
          errorsMessages: [
            {
              message: 'Message not found or already read',
              field: 'messageId',
            },
          ],
        },
      },
    }),
  );
}
