import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { UserId } from '@lumio/core/decorators/user-id.decorator';
import { SendMessageInputDto } from '@lumio/modules/chat/api/dto/input/send-message.input.dto';
import { GetChatMessagesInputDto } from '@lumio/modules/chat/api/dto/input/get-chat-messages.input.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SendMessageCommand } from '@lumio/modules/chat/application/commands/send-message.command-handler';
import { MarkMessageReadCommand } from '@lumio/modules/chat/application/commands/mark-message-read.command-handler';
import { GetChatMessagesQuery } from '@lumio/modules/chat/application/queries/get-chat-messages.query-handler';

@Controller('chats')
export class ChatsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('send-message/:recipientId')
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @UserId() userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
    @Body() dto: SendMessageInputDto,
  ) {
    return this.commandBus.execute(
      new SendMessageCommand(userId, recipientId, dto.message),
    );
  }

  @Get('messages/:recipientId')
  @UseGuards(JwtAuthGuard)
  async getChatMessages(
    @UserId() userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
    @Query() dto: GetChatMessagesInputDto,
  ) {
    return this.queryBus.execute(
      new GetChatMessagesQuery(userId, recipientId, dto.page, dto.limit),
    );
  }

  @Post('messages/:messageId/read')
  @UseGuards(JwtAuthGuard)
  async markMessageAsRead(
    @UserId() userId: number,
    @Param('messageId') messageId: string,
  ) {
    return this.commandBus.execute(
      new MarkMessageReadCommand(messageId, userId),
    );
  }
}
