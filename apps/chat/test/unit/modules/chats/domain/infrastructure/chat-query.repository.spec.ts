import { ChatQueryRepository } from '@chat/modules/chats/domain/infrastructure/chat-query.repository';
import { PrismaService } from '@chat/prisma/prisma.service';

describe('ChatQueryRepository', () => {
  let repository: ChatQueryRepository;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      message: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    } as unknown as jest.Mocked<PrismaService>;

    repository = new ChatQueryRepository(prisma);
  });

  it('requests message type and attachments so history can reconstruct media messages', async () => {
    await repository.getChatMessages(15, 20, undefined);

    expect(prisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          type: true,
          readAt: true,
          attachments: {
            select: {
              id: true,
              type: true,
              url: true,
              mimeType: true,
              size: true,
              duration: true,
              width: true,
              height: true,
              createdAt: true,
            },
          },
        }),
      }),
    );
  });
});
