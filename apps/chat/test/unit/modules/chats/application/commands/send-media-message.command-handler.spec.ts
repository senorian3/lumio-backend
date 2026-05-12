import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { EventBus } from '@nestjs/cqrs';
import {
  SendMediaMessageCommand,
  SendMediaMessageCommandHandler,
} from '@chat/modules/chats/application/commands/send-media-message.command-handler';
import { MediaMessageCreatedEvent } from '@chat/modules/chats/application/events/media-message-created.event';
import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';
import { FilesHttpAdapter } from '@chat/core/adapters/files-http.adapter';
import { MessageType } from '@chat/modules/chats/domain/message-types.enum';

describe('SendMediaMessageCommandHandler', () => {
  let handler: SendMediaMessageCommandHandler;
  let chatRepository: jest.Mocked<ChatRepository>;
  let filesHttpAdapter: jest.Mocked<FilesHttpAdapter>;
  let eventBus: jest.Mocked<EventBus>;

  const createMockFile = (overrides: Partial<Express.Multer.File> = {}) =>
    ({
      buffer: Buffer.from('content'),
      mimetype: 'image/png',
      originalname: 'test.png',
      size: 1024,
      ...overrides,
    }) as Express.Multer.File;

  beforeEach(() => {
    chatRepository = {
      findPrivateChatByUsers: jest.fn(),
      createPrivateChat: jest.fn(),
      createMessageWithAttachment: jest.fn(),
    } as unknown as jest.Mocked<ChatRepository>;

    filesHttpAdapter = {
      validateImageFile: jest.fn(),
      validateVoiceFile: jest.fn(),
      uploadFile: jest.fn(),
    } as unknown as jest.Mocked<FilesHttpAdapter>;

    eventBus = {
      publish: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new SendMediaMessageCommandHandler(
      chatRepository,
      filesHttpAdapter,
      eventBus,
    );
  });

  it('throws when no file is provided', async () => {
    await expect(
      handler.execute(
        new SendMediaMessageCommand(77, 12, MessageType.IMAGE, null as any),
      ),
    ).rejects.toThrow(BadRequestDomainException);
  });

  it('throws when the actor tries to send a message to themself', async () => {
    const file = createMockFile();

    await expect(
      handler.execute(
        new SendMediaMessageCommand(77, 77, MessageType.IMAGE, file),
      ),
    ).rejects.toThrow(BadRequestDomainException);
  });

  it('validates image file for IMAGE type messages', async () => {
    const file = createMockFile();
    chatRepository.findPrivateChatByUsers.mockResolvedValue({ id: 15 } as any);
    chatRepository.createMessageWithAttachment.mockResolvedValue({
      id: 'message-1',
      content: '',
      createdAt: new Date('2026-04-22T10:00:00.000Z'),
      attachments: [],
    } as any);
    filesHttpAdapter.uploadFile.mockResolvedValue({
      id: 'file-1',
      url: 'https://files.example.com/chat/attachment.png',
      key: 'chat/5/attachment.png',
      size: 1024,
      mimeType: 'image/png',
      createdAt: '2026-04-22T10:00:00.000Z',
    });

    await handler.execute(
      new SendMediaMessageCommand(77, 12, MessageType.IMAGE, file, 'look', {
        width: 1080,
        height: 720,
      }),
    );

    expect(filesHttpAdapter.validateImageFile).toHaveBeenCalledWith(file);
    expect(filesHttpAdapter.validateVoiceFile).not.toHaveBeenCalled();
  });

  it('validates voice file for VOICE type messages', async () => {
    const file = createMockFile({ mimetype: 'audio/mpeg', size: 500000 });
    chatRepository.findPrivateChatByUsers.mockResolvedValue({ id: 15 } as any);
    chatRepository.createMessageWithAttachment.mockResolvedValue({
      id: 'message-1',
      content: '',
      createdAt: new Date('2026-04-22T10:00:00.000Z'),
      attachments: [],
    } as any);
    filesHttpAdapter.uploadFile.mockResolvedValue({
      id: 'file-1',
      url: 'https://files.example.com/chat/voice.mp3',
      key: 'chat/5/voice.mp3',
      size: 500000,
      mimeType: 'audio/mpeg',
      createdAt: '2026-04-22T10:00:00.000Z',
    });

    await handler.execute(
      new SendMediaMessageCommand(77, 12, MessageType.VOICE, file, '', {
        duration: 17,
      }),
    );

    expect(filesHttpAdapter.validateVoiceFile).toHaveBeenCalledWith(file);
    expect(filesHttpAdapter.validateImageFile).not.toHaveBeenCalled();
  });

  it('throws when a VOICE message includes text', async () => {
    const file = createMockFile({ mimetype: 'audio/mpeg', size: 500000 });

    await expect(
      handler.execute(
        new SendMediaMessageCommand(77, 12, MessageType.VOICE, file, 'hello'),
      ),
    ).rejects.toThrow(BadRequestDomainException);
  });

  it('throws when a VOICE message includes image dimensions', async () => {
    const file = createMockFile({ mimetype: 'audio/mpeg', size: 500000 });

    await expect(
      handler.execute(
        new SendMediaMessageCommand(77, 12, MessageType.VOICE, file, '', {
          width: 1080,
          height: 720,
        }),
      ),
    ).rejects.toThrow(BadRequestDomainException);
  });

  it('throws when an IMAGE message includes voice duration', async () => {
    const file = createMockFile();

    await expect(
      handler.execute(
        new SendMediaMessageCommand(77, 12, MessageType.IMAGE, file, 'look', {
          duration: 17,
        }),
      ),
    ).rejects.toThrow(BadRequestDomainException);
  });

  it('stores VOICE messages without text content and without image metadata', async () => {
    const file = createMockFile({ mimetype: 'audio/mpeg', size: 500000 });
    chatRepository.findPrivateChatByUsers.mockResolvedValue({ id: 15 } as any);
    chatRepository.createMessageWithAttachment.mockResolvedValue({
      id: 'message-1',
      content: '',
      createdAt: new Date('2026-04-22T10:00:00.000Z'),
      attachments: [],
    } as any);
    filesHttpAdapter.uploadFile.mockResolvedValue({
      id: 'file-1',
      url: 'https://files.example.com/chat/voice.mp3',
      key: 'chat/5/voice.mp3',
      size: 500000,
      mimeType: 'audio/mpeg',
      createdAt: '2026-04-22T10:00:00.000Z',
    });

    await handler.execute(
      new SendMediaMessageCommand(77, 12, MessageType.VOICE, file, '   ', {
        duration: 17,
      }),
    );

    expect(chatRepository.createMessageWithAttachment).toHaveBeenCalledWith(
      expect.objectContaining({
        content: '',
        attachments: {
          create: expect.objectContaining({
            duration: 17,
            width: undefined,
            height: undefined,
          }),
        },
      }),
    );
  });

  it('throws for unsupported media type', async () => {
    const file = createMockFile();

    await expect(
      handler.execute(
        new SendMediaMessageCommand(77, 12, 'PDF' as MessageType, file),
      ),
    ).rejects.toThrow(BadRequestDomainException);
  });

  it('creates a private chat when none exists and uploads file', async () => {
    const file = createMockFile();
    chatRepository.findPrivateChatByUsers.mockResolvedValue(null);
    chatRepository.createPrivateChat.mockResolvedValue({ id: 15 } as any);
    chatRepository.createMessageWithAttachment.mockResolvedValue({
      id: 'message-1',
      content: 'look',
      createdAt: new Date('2026-04-22T10:00:00.000Z'),
      attachments: [],
    } as any);
    filesHttpAdapter.uploadFile.mockResolvedValue({
      id: 'file-1',
      url: 'https://files.example.com/chat/attachment.png',
      key: 'chat/5/attachment.png',
      size: 1024,
      mimeType: 'image/png',
      createdAt: '2026-04-22T10:00:00.000Z',
    });

    await handler.execute(
      new SendMediaMessageCommand(77, 12, MessageType.IMAGE, file, 'look', {
        width: 1080,
        height: 720,
      }),
    );

    expect(chatRepository.findPrivateChatByUsers).toHaveBeenCalledWith(77, 12);
    expect(chatRepository.createPrivateChat).toHaveBeenCalledWith(77, 12);
    expect(filesHttpAdapter.uploadFile).toHaveBeenCalled();
    expect(chatRepository.createMessageWithAttachment).toHaveBeenCalled();
  });

  it('reuses an existing private chat when one already exists', async () => {
    const file = createMockFile();
    chatRepository.findPrivateChatByUsers.mockResolvedValue({ id: 15 } as any);
    chatRepository.createMessageWithAttachment.mockResolvedValue({
      id: 'message-1',
      content: 'look',
      createdAt: new Date('2026-04-22T10:00:00.000Z'),
      attachments: [],
    } as any);
    filesHttpAdapter.uploadFile.mockResolvedValue({
      id: 'file-1',
      url: 'https://files.example.com/chat/attachment.png',
      key: 'chat/5/attachment.png',
      size: 1024,
      mimeType: 'image/png',
      createdAt: '2026-04-22T10:00:00.000Z',
    });

    await handler.execute(
      new SendMediaMessageCommand(77, 12, MessageType.IMAGE, file, 'look'),
    );

    expect(chatRepository.createPrivateChat).not.toHaveBeenCalled();
  });

  it('publishes a MediaMessageCreatedEvent with correct payload', async () => {
    const createdAt = new Date('2026-04-22T10:00:00.000Z');
    const file = createMockFile();
    chatRepository.findPrivateChatByUsers.mockResolvedValue({ id: 15 } as any);
    chatRepository.createMessageWithAttachment.mockResolvedValue({
      id: 'message-1',
      content: 'look',
      createdAt,
      attachments: [],
    } as any);
    filesHttpAdapter.uploadFile.mockResolvedValue({
      id: 'file-1',
      url: 'https://files.example.com/chat/attachment.png',
      key: 'chat/5/attachment.png',
      size: 1024,
      mimeType: 'image/png',
      createdAt: '2026-04-22T10:00:00.000Z',
    });

    await handler.execute(
      new SendMediaMessageCommand(77, 12, MessageType.IMAGE, file, 'look', {
        width: 1080,
        height: 720,
      }),
    );

    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(MediaMessageCreatedEvent),
    );
  });

  it('returns message and file on success', async () => {
    const createdAt = new Date('2026-04-22T10:00:00.000Z');
    const file = createMockFile();
    const mockMessage = {
      id: 'message-1',
      content: 'look',
      createdAt,
      attachments: [],
    };
    const mockUploadedFile = {
      id: 'file-1',
      url: 'https://files.example.com/chat/attachment.png',
      key: 'chat/5/attachment.png',
      size: 1024,
      mimeType: 'image/png',
      createdAt: '2026-04-22T10:00:00.000Z',
    };

    chatRepository.findPrivateChatByUsers.mockResolvedValue({ id: 15 } as any);
    chatRepository.createMessageWithAttachment.mockResolvedValue(
      mockMessage as any,
    );
    filesHttpAdapter.uploadFile.mockResolvedValue(mockUploadedFile);

    const result = await handler.execute(
      new SendMediaMessageCommand(77, 12, MessageType.IMAGE, file, 'look'),
    );

    expect(result).toEqual({
      message: mockMessage,
      file: mockUploadedFile,
    });
  });
});
