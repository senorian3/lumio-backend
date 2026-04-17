import { Body, Controller, Post } from '@nestjs/common';

@Controller('chats')
export class chatController {
  constructor() {}

  @Post('send-message')
  async sendMessage(
    @Body() dto: { userId: number; recipientId: number; message: string },
  ) {
    console.log(dto);
  }
}
