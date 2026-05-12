import { AttachmentType } from '@chat/modules/chats/domain/message-types.enum';

export class UploadFileMetadataDto {
  type?: AttachmentType;
  duration?: number;
  width?: number;
  height?: number;
}

export class UploadFileDto {
  file: Express.Multer.File;
  userId: number;
  chatId: number;
  messageId: string;
  metadata?: UploadFileMetadataDto;
}
