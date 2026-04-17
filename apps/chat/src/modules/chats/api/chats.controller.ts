import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { SendMessageInputDto } from '@chat/modules/chats/api/dto/input/send-message.input.dto';
import { SendMessageCommand } from '@chat/modules/chats/application/commands/send-message.command-handler';

@Controller('chats')
export class chatController {
  constructor(private readonly commandBud: CommandBus) {}

  @Post('send-message')
  async sendMessage(@Body() dto: SendMessageInputDto) {
    return await this.commandBud.execute(
      new SendMessageCommand(dto.userId, dto.recipientId, dto.message),
    );
  }
}
