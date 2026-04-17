import { Injectable } from '@nestjs/common';
import { PrismaService } from '@chat/prisma/prisma.service';
import { Message, Prisma } from '@generated/prisma-chat';

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPrivateChatByUsers(userId1: number, userId2: number) {
    return this.prisma.chat.findFirst({
      where: {
        deletedAt: null,
        name: null,
        AND: [
          {
            participants: {
              some: {
                userId: userId1,
                leftAt: null,
              },
            },
          },
          {
            participants: {
              some: {
                userId: userId2,
                leftAt: null,
              },
            },
          },
        ],
      },
    });
  }

  async createPrivateChat(userId1: number, userId2: number) {
    return this.prisma.$transaction(async (tx) => {
      const chat = await tx.chat.create({
        data: {
          participants: {
            createMany: {
              data: [{ userId: userId1 }, { userId: userId2 }],
            },
          },
        },
      });

      return chat;
    });
  }

  async createMessage(data: Prisma.MessageCreateInput): Promise<Message> {
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data,
      });

      await tx.chat.update({
        where: { id: data.chat.connect?.id },
        data: { lastMessageAt: new Date() },
      });

      return message;
    });
  }

  async isUserInChat(chatId: number, userId: number): Promise<boolean> {
    const participant = await this.prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId,
        leftAt: null,
      },
    });

    return !!participant;
  }

  async findChatById(chatId: number) {
    return this.prisma.chat.findUnique({
      where: {
        id: chatId,
        deletedAt: null,
      },
    });
  }
}
