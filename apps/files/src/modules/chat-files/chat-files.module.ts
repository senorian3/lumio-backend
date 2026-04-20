import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ChatFilesController } from './api/chat-files.controller';
import { UploadChatFileCommandHandler } from './application/commands/upload-chat-file.command-handler';
import { DeleteChatFileCommandHandler } from './application/commands/delete-chat-file.command-handler';
import { ChatFileRepository } from './domain/infrastructure/chat-file.repository';
import { S3FilesHttpAdapter } from '@files/core/adapters/s3-files-http.adapter';

const commandHandlers = [
  UploadChatFileCommandHandler,
  DeleteChatFileCommandHandler,
];

const repositories = [ChatFileRepository];
const adapters = [S3FilesHttpAdapter];

@Module({
  imports: [CqrsModule],
  controllers: [ChatFilesController],
  providers: [...commandHandlers, ...repositories, ...adapters],
  exports: [...repositories],
})
export class ChatFilesModule {}
