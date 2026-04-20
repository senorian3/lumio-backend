import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';
import {
  FilesHttpAdapter,
  UploadFileDto,
} from '@chat/core/adapters/files-http.adapter';
import { MessageType } from '@chat/modules/chats/domain/message-types.enum';
import { MediaMessageCreatedEvent } from '../events/media-message-created.event';

export class SendMediaMessageCommand {
  constructor(
    public readonly userId: number,
    public readonly recipientId: number,
    public readonly type: MessageType,
    public readonly file: Express.Multer.File,
    public readonly text?: string,
    public readonly metadata?: {
      duration?: number; // for voice messages in seconds
      width?: number; // for images
      height?: number; // for images
    },
  ) {}
}

@CommandHandler(SendMediaMessageCommand)
export class SendMediaMessageCommandHandler implements ICommandHandler<SendMediaMessageCommand> {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly filesHttpAdapter: FilesHttpAdapter,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: SendMediaMessageCommand) {
    const { userId, recipientId, type, file, text, metadata } = command;

    if (userId === recipientId) {
      throw BadRequestDomainException.create(
        'Cannot send message to yourself',
        'recipientId',
      );
    }

    if (type === MessageType.IMAGE) {
      this.filesHttpAdapter.validateImageFile(file);
    } else if (type === MessageType.VOICE) {
      this.filesHttpAdapter.validateVoiceFile(file);
    } else {
      throw BadRequestDomainException.create(
        'Unsupported media type for this command',
        'type',
      );
    }

    const uploadDto: UploadFileDto = {
      file,
      userId,
      metadata: {
        type: type as 'IMAGE' | 'VOICE',
        duration: metadata?.duration,
        width: metadata?.width,
        height: metadata?.height,
      },
    };

    const uploadedFile = await this.filesHttpAdapter.uploadFile(uploadDto);

    let chat = await this.chatRepository.findPrivateChatByUsers(
      userId,
      recipientId,
    );

    if (!chat) {
      chat = await this.chatRepository.createPrivateChat(userId, recipientId);
    }

    // Create message with attachment
    const createdMessage =
      await this.chatRepository.createMessageWithAttachment({
        chat: { connect: { id: chat.id } },
        senderId: userId,
        content: text || '', // Text is optional for media messages
        type,
        attachments: {
          create: {
            type: type as any, // TEXT, IMAGE, or VOICE
            url: uploadedFile.url,
            mimeType: uploadedFile.mimeType,
            size: uploadedFile.size,
            duration: metadata?.duration,
            width: metadata?.width,
            height: metadata?.height,
          },
        },
      });

    // Update chat's last message timestamp
    await this.chatRepository.updateChatLastMessage(
      chat.id,
      createdMessage.createdAt,
    );

    // Emit event for real-time notification
    this.eventBus.publish(
      new MediaMessageCreatedEvent(
        chat.id,
        createdMessage.id,
        userId,
        recipientId,
        type,
        createdMessage.content,
        {
          url: uploadedFile.url,
          key: uploadedFile.key,
          mimeType: uploadedFile.mimeType,
          size: uploadedFile.size,
          duration: metadata?.duration,
          width: metadata?.width,
          height: metadata?.height,
        },
        createdMessage.createdAt,
      ),
    );

    return {
      message: createdMessage,
      file: uploadedFile,
    };
  }
}
