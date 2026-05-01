import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import { InternalApiGuard } from '@files/core/guards/internal/internal-api.guard';
import { UploadChatFileCommand } from '../application/commands/upload-chat-file.command-handler';
import { DeleteChatFileCommand } from '../application/commands/delete-chat-file.command-handler';
import { UploadChatFileInputDto } from './dto/input/upload-chat-file.input.dto';
import { FILES_BASE, FILES_ROUTES } from '@files/core/routes/chat-files-routes';

@Controller(FILES_BASE)
@UseGuards(InternalApiGuard)
export class ChatFilesController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(FILES_ROUTES.UPLOAD)
  @UseInterceptors(FileInterceptor('file'))
  async uploadChatFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadChatFileInputDto,
  ) {
    return await this.commandBus.execute(
      new UploadChatFileCommand(
        file,
        dto.userId,
        dto.chatId,
        dto.messageId,
        dto.fileType,
      ),
    );
  }

  @Delete(':fileKey')
  async deleteChatFile(@Param('fileKey') fileKey: string) {
    return await this.commandBus.execute(new DeleteChatFileCommand(fileKey));
  }

  @Get(':fileKey')
  async getChatFile(@Param('fileKey') fileKey: string) {
    // TODO: Implement query to get file info
    return { fileKey, url: `https://s3.amazonaws.com/bucket/${fileKey}` };
  }
}
