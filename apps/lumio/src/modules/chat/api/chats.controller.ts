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

@Controller('chats')
export class ChatsController {
  @Post('send-message/:recipientId')
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @UserId() userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
    @Body() dto: SendMessageInputDto,
  ): Promise<any> {
    console.log(dto, userId, recipientId);
  }
}
