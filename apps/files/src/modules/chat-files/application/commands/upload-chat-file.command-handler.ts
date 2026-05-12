import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { S3FilesHttpAdapter } from '@files/core/adapters/s3-files-http.adapter';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ChatFileType } from '../../api/dto/input/upload-chat-file.input.dto';
import { ChatFileRepository } from '../../domain/infrastructure/chat-file.repository';

export class UploadChatFileCommand {
  constructor(
    public readonly file: Express.Multer.File,
    public readonly userId: number,
    public readonly chatId: number,
    public readonly messageId: string,
    public readonly fileType: ChatFileType,
  ) {}
}

@CommandHandler(UploadChatFileCommand)
export class UploadChatFileCommandHandler implements ICommandHandler<UploadChatFileCommand> {
  constructor(
    private readonly chatFileRepository: ChatFileRepository,
    private readonly s3Adapter: S3FilesHttpAdapter,
  ) {}

  async execute(command: UploadChatFileCommand) {
    const { file, userId, chatId, messageId, fileType } = command;

    // Validate file
    if (!file || !file.buffer) {
      throw BadRequestDomainException.create('File is required', 'file');
    }

    // Upload to S3
    const uploadedFiles = await this.s3Adapter.uploadFiles('chats', chatId, [
      file,
    ]);

    if (!uploadedFiles || uploadedFiles.length === 0) {
      throw BadRequestDomainException.create(
        'Failed to upload file to S3',
        'file',
      );
    }

    const uploadedFile = uploadedFiles[0];

    // Save to database
    const chatFile = await this.chatFileRepository.create({
      key: uploadedFile.key,
      url: uploadedFile.url,
      type: fileType,
      size: file.size,
      userId,
      chatId,
      messageId,
      originalName: file.originalname,
      mimeType: file.mimetype,
    });

    return {
      fileKey: chatFile.key,
      url: chatFile.url,
      type: chatFile.type,
      size: chatFile.size,
      createdAt: chatFile.createdAt,
    };
  }
}
