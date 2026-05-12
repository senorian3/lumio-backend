import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';

describe('ChatRepository', () => {
  let repository: ChatRepository;
  let prisma: any;

  const mockTransaction = (overrides: any = {}) => {
    const tx = {
      chat: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      message: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      chatParticipant: {
        findFirst: jest.fn(),
      },
      ...overrides,
    };
    return tx;
  };

  beforeEach(() => {
    const mockPrisma = {
      chat: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      chatParticipant: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    prisma = mockPrisma;
    repository = new ChatRepository(prisma);
  });

  describe('findPrivateChatByUsers', () => {
    it('finds a private chat by two user IDs', async () => {
      const mockChat = { id: 15, name: null, deletedAt: null };
      prisma.chat.findFirst.mockResolvedValue(mockChat as any);

      const result = await repository.findPrivateChatByUsers(77, 12);

      expect(prisma.chat.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            name: null,
          }),
        }),
      );
      expect(result).toEqual(mockChat);
    });

    it('returns null when no private chat exists', async () => {
      prisma.chat.findFirst.mockResolvedValue(null);

      const result = await repository.findPrivateChatByUsers(77, 12);

      expect(result).toBeNull();
    });
  });

  describe('createPrivateChat', () => {
    it('creates a private chat with two participants in a transaction', async () => {
      const tx = mockTransaction();
      tx.chat.create.mockResolvedValue({ id: 15 });
      prisma.$transaction.mockImplementation((cb: (tx: any) => Promise<any>) =>
        cb(tx),
      );

      const result = await repository.createPrivateChat(77, 12);

      expect(tx.chat.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            participants: {
              createMany: {
                data: [{ userId: 77 }, { userId: 12 }],
              },
            },
          }),
        }),
      );
      expect(result).toEqual({ id: 15 });
    });
  });

  describe('createMessage', () => {
    it('creates a message and updates chat lastMessageAt in a transaction', async () => {
      const tx = mockTransaction();
      const mockMessage = { id: 'message-1', content: 'hello' };
      tx.message.create.mockResolvedValue(mockMessage);
      prisma.$transaction.mockImplementation((cb: (tx: any) => Promise<any>) =>
        cb(tx),
      );

      const result = await repository.createMessage({
        chat: { connect: { id: 15 } },
        senderId: 77,
        content: 'hello',
        type: 'TEXT',
      });

      expect(tx.message.create).toHaveBeenCalled();
      expect(tx.chat.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 15 },
          data: { lastMessageAt: expect.any(Date) },
        }),
      );
      expect(result).toEqual(mockMessage);
    });
  });

  describe('isUserInChat', () => {
    it('returns true when user is an active participant', async () => {
      prisma.chatParticipant.findFirst.mockResolvedValue({
        id: 1,
        chatId: 15,
        userId: 77,
        leftAt: null,
      } as any);

      const result = await repository.isUserInChat(15, 77);

      expect(result).toBe(true);
    });

    it('returns false when user is not a participant', async () => {
      prisma.chatParticipant.findFirst.mockResolvedValue(null);

      const result = await repository.isUserInChat(15, 77);

      expect(result).toBe(false);
    });
  });

  describe('findChatById', () => {
    it('finds a chat by ID', async () => {
      const mockChat = { id: 15, deletedAt: null };
      prisma.chat.findUnique.mockResolvedValue(mockChat as any);

      const result = await repository.findChatById(15);

      expect(prisma.chat.findUnique).toHaveBeenCalledWith({
        where: { id: 15, deletedAt: null },
      });
      expect(result).toEqual(mockChat);
    });
  });

  describe('markMessageAsRead', () => {
    it('marks a message as read and returns updated data', async () => {
      const tx = mockTransaction();
      const mockMessage = {
        id: 'message-1',
        chatId: 15,
        senderId: 12,
      };
      tx.message.findFirst.mockResolvedValue(mockMessage);
      tx.message.update.mockResolvedValue({ ...mockMessage, status: 'READ' });
      prisma.$transaction.mockImplementation((cb: (tx: any) => Promise<any>) =>
        cb(tx),
      );

      const result = await repository.markMessageAsRead('message-1', 77);

      expect(tx.message.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'message-1',
            senderId: { not: 77 },
            status: 'SENT',
            deletedAt: null,
          }),
        }),
      );
      expect(tx.message.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'message-1' },
          data: { status: 'READ', readAt: expect.any(Date) },
        }),
      );
      expect(result).toEqual({
        ...mockMessage,
        readAt: expect.any(Date),
      });
    });

    it('returns null when message is not found or already read', async () => {
      const tx = mockTransaction();
      tx.message.findFirst.mockResolvedValue(null);
      prisma.$transaction.mockImplementation((cb: (tx: any) => Promise<any>) =>
        cb(tx),
      );

      const result = await repository.markMessageAsRead('message-1', 77);

      expect(result).toBeNull();
    });
  });

  describe('createMessageWithAttachment', () => {
    it('creates a message with attachments and updates chat lastMessageAt', async () => {
      const tx = mockTransaction();
      const mockMessage = {
        id: 'message-1',
        content: 'look',
        attachments: [{ id: 1, url: 'https://example.com/file.png' }],
      };
      tx.message.create.mockResolvedValue(mockMessage);
      prisma.$transaction.mockImplementation((cb: (tx: any) => Promise<any>) =>
        cb(tx),
      );

      const result = await repository.createMessageWithAttachment({
        id: 'message-1',
        chat: { connect: { id: 15 } },
        senderId: 77,
        content: 'look',
        type: 'IMAGE',
        attachments: {
          create: {
            type: 'IMAGE',
            url: 'https://example.com/file.png',
            mimeType: 'image/png',
            size: 1024,
          },
        },
      });

      expect(tx.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            attachments: expect.objectContaining({
              create: expect.objectContaining({
                type: 'IMAGE',
                url: 'https://example.com/file.png',
              }),
            }),
          }),
          include: { attachments: true },
        }),
      );
      expect(tx.chat.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 15 },
          data: { lastMessageAt: expect.any(Date) },
        }),
      );
      expect(result).toEqual(mockMessage);
    });
  });

  describe('updateChatLastMessage', () => {
    it('updates the lastMessageAt field of a chat', async () => {
      const date = new Date();
      prisma.chat.update.mockResolvedValue({} as any);

      await repository.updateChatLastMessage(15, date);

      expect(prisma.chat.update).toHaveBeenCalledWith({
        where: { id: 15 },
        data: { lastMessageAt: date },
      });
    });
  });
});
