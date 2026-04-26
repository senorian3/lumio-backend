import {
  AttachmentType,
  MessageStatus,
  MessageType,
} from '@chat/modules/chats/domain/message-types.enum';

export const chatErrorResponseSchema = {
  type: 'object',
  properties: {
    errorsMessages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          field: {
            oneOf: [{ type: 'string' }, { type: 'null' }],
          },
        },
      },
    },
  },
};

export const chatAttachmentSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 101 },
    type: {
      type: 'string',
      enum: Object.values(AttachmentType),
      example: AttachmentType.IMAGE,
    },
    url: {
      type: 'string',
      example: 'https://files.example.com/chat/attachment.png',
    },
    mimeType: { type: 'string', example: 'image/png' },
    size: { type: 'number', example: 1024 },
    duration: { type: 'number', example: 17, nullable: true },
    width: { type: 'number', example: 1080, nullable: true },
    height: { type: 'number', example: 720, nullable: true },
    createdAt: {
      type: 'string',
      format: 'date-time',
      example: '2026-04-22T10:00:00.000Z',
    },
  },
};

export const chatMessageSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      example: '8c9e1671-9f3c-493f-a8df-8a8e8e8c8e8e',
    },
    chatId: { type: 'number', example: 5 },
    senderId: { type: 'number', example: 77 },
    content: { type: 'string', example: 'hello' },
    type: {
      type: 'string',
      enum: Object.values(MessageType),
      example: MessageType.TEXT,
    },
    status: {
      type: 'string',
      enum: Object.values(MessageStatus),
      example: MessageStatus.SENT,
    },
    readAt: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      example: null,
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      example: '2026-04-22T10:00:00.000Z',
    },
    attachments: {
      type: 'array',
      items: chatAttachmentSchema,
    },
  },
};

export const internalApiUnauthorizedExample = {
  errorsMessages: [
    {
      message: 'Internal API key is missing',
      field: 'internal-api',
    },
  ],
};
