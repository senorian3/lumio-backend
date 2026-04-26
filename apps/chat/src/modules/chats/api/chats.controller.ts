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
import { ActorUserId } from '@chat/core/decorators/actor-user-id.decorator';
import { ApiChatsController } from '@chat/core/decorators/swagger/chats/chats-controller.decorator';
import { ApiSendChatMessage } from '@chat/core/decorators/swagger/chats/send-chat-message.decorator';
import { ApiSendChatMediaMessage } from '@chat/core/decorators/swagger/chats/send-chat-media-message.decorator';
import { ApiGetChatMessages } from '@chat/core/decorators/swagger/chats/get-chat-messages.decorator';
import { ApiMarkChatMessageRead } from '@chat/core/decorators/swagger/chats/mark-chat-message-read.decorator';

@UseGuards(InternalApiGuard)
@ApiChatsController()
@Controller('chats')
export class ChatsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('send-message')
  @ApiSendChatMessage()
  async sendMessage(
    @ActorUserId() actorUserId: number,
    @Body() dto: SendMessageInputDto,
  ) {
    return await this.commandBus.execute(
      new SendMessageCommand(actorUserId, dto.recipientId, dto.message),
    );
  }

  @Post('send-media-message')
  @UseInterceptors(FileInterceptor('file'))
  @ApiSendChatMediaMessage()
  async sendMediaMessage(
    @ActorUserId() actorUserId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: SendMediaMessageInputDto,
  ) {
    return await this.commandBus.execute(
      new SendMediaMessageCommand(
        actorUserId,
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
  @ApiGetChatMessages()
  async getChatMessages(
    @ActorUserId() actorUserId: number,
    @Query() dto: GetChatMessagesInputDto,
  ) {
    return await this.queryBus.execute(
      new GetChatMessagesQuery(
        actorUserId,
        dto.recipientId,
        dto.page,
        dto.limit,
      ),
    );
  }

  @Post('messages/:messageId/read')
  @ApiMarkChatMessageRead()
  async markMessageAsRead(
    @Param('messageId') messageId: string,
    @ActorUserId() actorUserId: number,
  ) {
    return await this.commandBus.execute(
      new MarkMessageReadCommand(messageId, actorUserId),
    );
  }
}
