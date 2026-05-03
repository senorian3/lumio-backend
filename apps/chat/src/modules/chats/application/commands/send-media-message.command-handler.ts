import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';
import { FilesHttpAdapter } from '@chat/core/adapters/files-http.adapter';
import { UploadFileDto } from '@chat/core/adapters/dto/upload-file.dto';
import {
  AttachmentType,
  MessageType,
} from '@chat/modules/chats/domain/message-types.enum';
import { MediaMessageCreatedEvent } from '../events/media-message-created.event';
import { randomUUID } from 'crypto';
import { MediaMessageMetadata } from '@chat/modules/chats/application/types/media-message-metadata.type';

export class SendMediaMessageCommand {
  constructor(
    public readonly userId: number,
    public readonly recipientId: number,
    public readonly type: MessageType,
    public readonly file: Express.Multer.File,
    public readonly text?: string,
    public readonly metadata?: MediaMessageMetadata,
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

    if (!file) {
      throw BadRequestDomainException.create('Media file is required', 'file');
    }

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

    this.validateMediaPayload(type, text, metadata);
    const mediaMetadata = this.buildMediaMetadata(type, metadata);

    let chat = await this.chatRepository.findPrivateChatByUsers(
      userId,
      recipientId,
    );

    if (!chat) {
      chat = await this.chatRepository.createPrivateChat(userId, recipientId);
    }

    const messageId = randomUUID();
    const attachmentType = this.mapToAttachmentType(type);
    const messageContent = type === MessageType.VOICE ? '' : text || '';
    const uploadDto: UploadFileDto = {
      file,
      userId,
      chatId: chat.id,
      messageId,
      metadata: {
        type: attachmentType,
        duration: mediaMetadata.duration,
        width: mediaMetadata.width,
        height: mediaMetadata.height,
      },
    };

    const uploadedFile = await this.filesHttpAdapter.uploadFile(uploadDto);

    const createdMessage =
      await this.chatRepository.createMessageWithAttachment({
        id: messageId,
        chat: { connect: { id: chat.id } },
        senderId: userId,
        content: messageContent,
        type,
        attachments: {
          create: {
            type: attachmentType,
            url: uploadedFile.url,
            mimeType: uploadedFile.mimeType,
            size: uploadedFile.size,
            duration: mediaMetadata.duration,
            width: mediaMetadata.width,
            height: mediaMetadata.height,
          },
        },
      });

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
          duration: mediaMetadata.duration,
          width: mediaMetadata.width,
          height: mediaMetadata.height,
        },
        createdMessage.createdAt,
      ),
    );

    return {
      message: createdMessage,
      file: uploadedFile,
    };
  }

  private validateMediaPayload(
    type: MessageType,
    text?: string,
    metadata?: MediaMessageMetadata,
  ): void {
    if (type === MessageType.VOICE) {
      if (text?.trim()) {
        throw BadRequestDomainException.create(
          'Voice messages cannot include text',
          'text',
        );
      }

      if (this.hasValue(metadata?.width) || this.hasValue(metadata?.height)) {
        throw BadRequestDomainException.create(
          'Voice messages cannot include image dimensions',
          'metadata',
        );
      }
    }

    if (type === MessageType.IMAGE && this.hasValue(metadata?.duration)) {
      throw BadRequestDomainException.create(
        'Image messages cannot include voice duration',
        'duration',
      );
    }
  }

  private buildMediaMetadata(
    type: MessageType,
    metadata?: MediaMessageMetadata,
  ): MediaMessageMetadata {
    if (type === MessageType.IMAGE) {
      return {
        width: metadata?.width,
        height: metadata?.height,
      };
    }

    if (type === MessageType.VOICE) {
      return {
        duration: metadata?.duration,
      };
    }

    return {};
  }

  private hasValue(value: unknown): boolean {
    return value !== undefined && value !== null;
  }

  private mapToAttachmentType(type: MessageType): AttachmentType {
    if (type === MessageType.IMAGE) {
      return AttachmentType.IMAGE;
    }

    if (type === MessageType.VOICE) {
      return AttachmentType.VOICE;
    }

    throw BadRequestDomainException.create(
      'Unsupported media type for attachment creation',
      'type',
    );
  }
}
