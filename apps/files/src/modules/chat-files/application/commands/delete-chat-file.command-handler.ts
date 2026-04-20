import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ChatFileRepository } from '../../domain/infrastructure/chat-file.repository';
import { S3FilesHttpAdapter } from '@files/core/adapters/s3-files-http.adapter';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';

export class DeleteChatFileCommand {
  constructor(public readonly fileKey: string) {}
}

@CommandHandler(DeleteChatFileCommand)
export class DeleteChatFileCommandHandler implements ICommandHandler<DeleteChatFileCommand> {
  constructor(
    private readonly chatFileRepository: ChatFileRepository,
    private readonly s3Adapter: S3FilesHttpAdapter,
  ) {}

  async execute(command: DeleteChatFileCommand) {
    const { fileKey } = command;

    // Check if file exists
    const chatFile = await this.chatFileRepository.findByKey(fileKey);
    if (!chatFile) {
      throw NotFoundDomainException.create('Chat file not found', 'fileKey');
    }

    // Delete from S3
    await this.s3Adapter.deleteFile(fileKey);

    // Soft delete from database
    await this.chatFileRepository.softDeleteByKey(fileKey);

    return {
      success: true,
      message: 'Chat file deleted successfully',
      fileKey,
    };
  }
}
