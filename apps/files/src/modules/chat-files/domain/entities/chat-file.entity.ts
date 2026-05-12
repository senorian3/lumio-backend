export class ChatFileEntity {
  id: number;
  key: string;
  url: string;
  type: string;
  size: number;
  originalName: string;
  mimeType: string;
  createdAt: Date;
  deletedAt: Date | null;
  userId: number | null;
  chatId: number | null;
  messageId: string | null;
}
