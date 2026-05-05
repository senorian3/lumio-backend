import { Injectable } from '@nestjs/common';
import { PrismaService } from '@chat/prisma/prisma.service';

@Injectable()
export class ChatQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getChatMessages(chatId: number, limit: number, cursorId?: string) {
    const orderBy = [{ createdAt: 'desc' as const }, { id: 'desc' as const }];

    const messages = await this.prisma.message.findMany({
      where: {
        chatId,
        deletedAt: null,
      },
      select: {
        id: true,
        chatId: true,
        senderId: true,
        content: true,
        type: true,
        status: true,
        readAt: true,
        createdAt: true,
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
      },
      cursor: cursorId ? { id: cursorId } : undefined,
      skip: cursorId ? 1 : 0,
      take: limit + 1,
      orderBy,
    });

    const hasMore = messages.length > limit;

    const items = hasMore ? messages.slice(0, limit) : messages;

    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    const totalCount = await this.prisma.message.count({
      where: { chatId, deletedAt: null },
    });

    return {
      items,
      nextCursor,
      totalCount,
      limit,
      currentCursor: cursorId ?? null,
    };
  }
}
