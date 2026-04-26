import { Injectable } from '@nestjs/common';
import { PrismaService } from '@chat/prisma/prisma.service';

@Injectable()
export class ChatQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getChatMessages(chatId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
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
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.message.count({
        where: {
          chatId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items: messages,
    };
  }
}
