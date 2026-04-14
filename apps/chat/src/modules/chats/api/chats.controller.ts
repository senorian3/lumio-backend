import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatsService } from '../application/chats.service';

@ApiTags('Chats')
@ApiBearerAuth()
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all chats for current user' })
  async findAll(@Request() req) {
    // В реальном приложении userId будет извлекаться из JWT токена
    const userId = req.user?.id || 1; // Заглушка для тестирования
    return this.chatsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get chat by ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id || 1; // Заглушка для тестирования
    return this.chatsService.findOne(+id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new chat' })
  async create(@Body() createChatDto: any, @Request() req) {
    const creatorId = req.user?.id || 1; // Заглушка для тестирования
    return this.chatsService.create({
      ...createChatDto,
      creatorId,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete chat' })
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id || 1; // Заглушка для тестирования
    return this.chatsService.remove(+id, userId);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave chat' })
  async leaveChat(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id || 1; // Заглушка для тестирования
    return this.chatsService.leaveChat(+id, userId);
  }

  @Post(':id/participants')
  @ApiOperation({ summary: 'Add participant to chat' })
  async addParticipant(
    @Param('id') id: string,
    @Body() body: { userId: number },
    @Request() req,
  ) {
    const addedBy = req.user?.id || 1; // Заглушка для тестирования
    return this.chatsService.addParticipant(+id, body.userId, addedBy);
  }
}
