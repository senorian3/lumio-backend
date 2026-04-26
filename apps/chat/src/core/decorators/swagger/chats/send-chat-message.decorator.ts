import { HttpStatus, applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { SendMessageInputDto } from '@chat/modules/chats/api/dto/input/send-message.input.dto';
import {
  chatErrorResponseSchema,
  chatMessageSchema,
} from './chat-swagger.schemas';

export function ApiSendChatMessage() {
  return applyDecorators(
    ApiOperation({
      summary: 'Send a text message',
      description:
        'Creates or reuses a private chat and stores a text message.',
      operationId: 'sendChatMessage',
    }),
    ApiSecurity('internal'),
    ApiBody({
      type: SendMessageInputDto,
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Text message created.',
      schema: chatMessageSchema,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation failed or the actor tried to message themself.',
      schema: {
        ...chatErrorResponseSchema,
        example: {
          errorsMessages: [
            {
              message: 'Cannot send message to yourself',
              field: 'recipientId',
            },
          ],
        },
      },
    }),
  );
}
