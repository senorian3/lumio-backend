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
import { GetChatMessagesQuery } from '@chat/modules/chats/application/queries/get-chat-messages.query';
import { InternalApiGuard } from '@chat/core/guards/internal/internal-api.guard';
import { ActorUserId } from '@chat/core/decorators/actor-user-id.decorator';
import { ApiChatsController } from '@chat/core/decorators/swagger/chats/chats-controller.decorator';
import { ApiSendChatMessage } from '@chat/core/decorators/swagger/chats/send-chat-message.decorator';
import { ApiSendChatMediaMessage } from '@chat/core/decorators/swagger/chats/send-chat-media-message.decorator';
import { ApiGetChatMessages } from '@chat/core/decorators/swagger/chats/get-chat-messages.decorator';
import { ApiMarkChatMessageRead } from '@chat/core/decorators/swagger/chats/mark-chat-message-read.decorator';
import { WebSocketChatDocs } from '@chat/core/decorators/swagger/chats/websocket-chat-docs.decorator';
import { CHAT_BASE, CHAT_ROUTES } from '@chat/core/routes/chat-routes';
import { AllowInternalServices } from '@libs/core/internal-api/internal-api';

@UseGuards(InternalApiGuard)
@AllowInternalServices('lumio')
@ApiChatsController()
@Controller(CHAT_BASE)
export class ChatsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(CHAT_ROUTES.WEBSOCKET_DOCS)
  @WebSocketChatDocs()
  getWebSocketDocs(): {
    message: string;
    websocket: { namespace: string; url: string };
    events: {
      'connection:established': { userId: number };
      'message:created': {
        messageId: string;
        chatId: number;
        senderId: number;
        content: string;
        createdAt: string;
      };
      'message:sent': {
        messageId: string;
        chatId: number;
        content: string;
        createdAt: string;
      };
      'message:received': {
        messageId: string;
        chatId: number;
        senderId: number;
        content: string;
        createdAt: string;
      };
      'message:read': {
        messageId: string;
        chatId: number;
        readerId: number;
        readAt: string;
      };
      'user:typing': {
        userId: number;
        chatId: number;
        isTyping: boolean;
      };
      error: { message: string };
    };
  } {
    return {
      message: 'See Swagger description for WebSocket documentation',
      websocket: {
        namespace: '/',
        url: 'wss://lumio.su',
      },
      events: {
        'connection:established': {
          userId: 77,
        },
        'message:created': {
          messageId: '8c9e1671-9f3c-493f-a8df-8a8e8e8c8e8e',
          chatId: 5,
          senderId: 77,
          content: 'hello',
          createdAt: '2026-04-22T10:00:00.000Z',
        },
        'message:sent': {
          messageId: '8c9e1671-9f3c-493f-a8df-8a8e8e8c8e8e',
          chatId: 5,
          content: 'hello',
          createdAt: '2026-04-22T10:00:00.000Z',
        },
        'message:received': {
          messageId: '8c9e1671-9f3c-493f-a8df-8a8e8e8c8e8e',
          chatId: 5,
          senderId: 77,
          content: 'hello',
          createdAt: '2026-04-22T10:00:00.000Z',
        },
        'message:read': {
          messageId: '8c9e1671-9f3c-493f-a8df-8a8e8e8c8e8e',
          chatId: 5,
          readerId: 42,
          readAt: '2026-04-22T10:05:00.000Z',
        },
        'user:typing': {
          userId: 77,
          chatId: 5,
          isTyping: true,
        },
        error: {
          message: 'Unauthorized: Missing token',
        },
      },
    };
  }

  @Post(CHAT_ROUTES.SEND_MESSAGE)
  @ApiSendChatMessage()
  async sendMessage(
    @ActorUserId() actorUserId: number,
    @Body() dto: SendMessageInputDto,
  ) {
    return await this.commandBus.execute(
      new SendMessageCommand(actorUserId, dto.recipientId, dto.message),
    );
  }

  @Post(CHAT_ROUTES.SEND_MEDIA_MESSAGE)
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

  @Get(CHAT_ROUTES.GET_CHAT_MESSAGES)
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

  @Post(CHAT_ROUTES.MARK_MESSAGE_READ)
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
