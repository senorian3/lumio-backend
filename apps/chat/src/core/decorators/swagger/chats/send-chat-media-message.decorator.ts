import { HttpStatus, applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { MessageType } from '@chat/modules/chats/domain/message-types.enum';
import {
  chatErrorResponseSchema,
  chatMessageSchema,
} from './chat-swagger.schemas';

export function ApiSendChatMediaMessage() {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiOperation({
      summary: 'Send an image or voice message',
      description:
        'Creates or reuses a private chat, uploads the attached file, and stores a media message.',
      operationId: 'sendChatMediaMessage',
    }),
    ApiSecurity('internal'),
    ApiBody({
      description:
        'Multipart payload with a single file attachment. IMAGE files may include optional text, width, and height. VOICE files may include optional duration, but cannot include text, width, or height. IMAGE files must be JPEG/PNG/GIF/WEBP up to 1 MB. VOICE files must be MPEG/WAV/OGG/WEBM up to 3 MB.',
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Media file to upload.',
          },
          recipientId: {
            type: 'number',
            example: 12,
          },
          type: {
            type: 'string',
            enum: [MessageType.IMAGE, MessageType.VOICE],
            example: MessageType.IMAGE,
          },
          text: {
            type: 'string',
            example: 'Look at this',
            maxLength: 500,
            description: 'Allowed for IMAGE messages only.',
          },
          width: {
            type: 'number',
            example: 1080,
            description: 'Allowed for IMAGE messages only.',
          },
          height: {
            type: 'number',
            example: 720,
            description: 'Allowed for IMAGE messages only.',
          },
          duration: {
            type: 'number',
            example: 17,
            description: 'Allowed for VOICE messages only.',
          },
        },
        required: ['file', 'recipientId', 'type'],
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Media message created and file uploaded.',
      schema: {
        type: 'object',
        properties: {
          message: chatMessageSchema,
          file: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'chat-file-1' },
              url: {
                type: 'string',
                example: 'https://files.example.com/chat/attachment.png',
              },
              key: { type: 'string', example: 'chat/5/attachment.png' },
              size: { type: 'number', example: 1024 },
              mimeType: { type: 'string', example: 'image/png' },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2026-04-22T10:00:00.000Z',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description:
        'Validation failed, unsupported media type, invalid file, or the actor tried to message themself.',
      schema: {
        ...chatErrorResponseSchema,
        example: {
          errorsMessages: [
            {
              message: 'Image size exceeds 1 MB limit',
              field: 'file',
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Recipient user not found.',
      schema: {
        ...chatErrorResponseSchema,
        example: {
          errorsMessages: [
            {
              message: 'Recipient user not found',
              field: 'recipientId',
            },
          ],
        },
      },
    }),
  );
}
