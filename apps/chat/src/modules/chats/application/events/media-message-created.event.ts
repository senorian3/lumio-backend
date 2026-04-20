import { MessageType } from '@chat/modules/chats/domain/message-types.enum';

export class MediaMessageCreatedEvent {
  constructor(
    public readonly chatId: number,
    public readonly messageId: string,
    public readonly senderId: number,
    public readonly recipientId: number,
    public readonly type: MessageType,
    public readonly content: string,
    public readonly attachment: {
      url: string;
      key: string;
      mimeType: string;
      size: number;
      duration?: number;
      width?: number;
      height?: number;
    },
    public readonly createdAt: Date,
  ) {}
}
