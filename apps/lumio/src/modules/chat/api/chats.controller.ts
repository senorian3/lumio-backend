import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { UserId } from '@lumio/core/decorators/user-id.decorator';
import { SendMessageInputDto } from '@lumio/modules/chat/api/dto/input/send-message.input.dto';
import { CommandBus } from '@nestjs/cqrs';
import { SendMessageCommand } from '@lumio/modules/chat/application/commands/send-message.command-handler';

@Controller('chats')
export class ChatsController {
  constructor(private readonly commandBus: CommandBus) {}

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
}
