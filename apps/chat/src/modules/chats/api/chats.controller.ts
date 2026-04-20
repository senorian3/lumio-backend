import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import { SendMessageInputDto } from '@chat/modules/chats/api/dto/input/send-message.input.dto';
import { SendMediaMessageInputDto } from '@chat/modules/chats/api/dto/input/send-media-message.input.dto';
import { GetChatMessagesInputDto } from '@chat/modules/chats/api/dto/input/get-chat-messages.input.dto';
import { SendMessageCommand } from '@chat/modules/chats/application/commands/send-message.command-handler';
import { SendMediaMessageCommand } from '@chat/modules/chats/application/commands/send-media-message.command-handler';
import { MarkMessageReadCommand } from '@chat/modules/chats/application/commands/mark-message-read.command-handler';
import { GetChatMessagesQuery } from '@chat/modules/chats/application/queries/get-chat-messages.query-handler';
import { InternalApiGuard } from '@chat/core/guards/internal/internal-api.guard';

@UseGuards(InternalApiGuard)
@Controller('chats')
export class ChatsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('send-message')
  async sendMessage(@Body() dto: SendMessageInputDto) {
    return await this.commandBus.execute(
      new SendMessageCommand(dto.userId, dto.recipientId, dto.message),
    );
  }

  @Post('send-media-message')
  @UseInterceptors(FileInterceptor('file'))
  async sendMediaMessage(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: SendMediaMessageInputDto,
  ) {
    return await this.commandBus.execute(
      new SendMediaMessageCommand(
        dto.userId,
        dto.recipientId,
        dto.type,
        file,
        dto.text,
        {
          duration: dto.duration,
          width: dto.width,
          height: dto.height,
        },
      ),
    );
  }

  @Get('messages')
  async getChatMessages(@Query() dto: GetChatMessagesInputDto) {
    return await this.queryBus.execute(
      new GetChatMessagesQuery(
        dto.userId,
        dto.recipientId,
        dto.page,
        dto.limit,
      ),
    );
  }

  @Post('messages/:messageId/read')
  async markMessageAsRead(
    @Param('messageId') messageId: string,
    @Body('userId') userId: number,
  ) {
    return await this.commandBus.execute(
      new MarkMessageReadCommand(messageId, userId),
    );
  }
}
