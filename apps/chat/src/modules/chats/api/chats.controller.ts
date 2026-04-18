import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SendMessageInputDto } from '@chat/modules/chats/api/dto/input/send-message.input.dto';
import { GetChatMessagesInputDto } from '@chat/modules/chats/api/dto/input/get-chat-messages.input.dto';
import { SendMessageCommand } from '@chat/modules/chats/application/commands/send-message.command-handler';
import { MarkMessageReadCommand } from '@chat/modules/chats/application/commands/mark-message-read.command-handler';
import { GetChatMessagesQuery } from '@chat/modules/chats/application/queries/get-chat-messages.query-handler';

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
