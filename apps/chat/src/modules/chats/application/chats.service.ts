import { Injectable } from '@nestjs/common';
import { PrismaService } from '@chat/prisma/prisma.service';

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.chat.findMany({
      where: {
        deletedAt: null,
        participants: {
          some: {
            userId,
            leftAt: null,
          },
        },
      },
      include: {
        participants: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          where: { deletedAt: null },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number) {
    return this.prisma.chat.findFirst({
      where: {
        id,
        deletedAt: null,
        participants: {
          some: {
            userId,
            leftAt: null,
          },
        },
      },
      include: {
        participants: true,
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: { attachments: true },
        },
      },
    });
  }

  async create(createChatDto: {
    name?: string;
    participantIds: number[];
    creatorId: number;
  }) {
    return this.prisma.chat.create({
      data: {
        name: createChatDto.name,
        participants: {
          create: [
            // Добавляем создателя
            { userId: createChatDto.creatorId },
            // Добавляем остальных участников
            ...createChatDto.participantIds
              .filter((id) => id !== createChatDto.creatorId)
              .map((userId) => ({ userId })),
          ],
        },
      },
      include: {
        participants: true,
      },
    });
  }

  async remove(id: number, userId: number) {
    // Проверяем, что пользователь является участником чата
    const participant = await this.prisma.chatParticipant.findFirst({
      where: { chatId: id, userId, leftAt: null },
    });

    if (!participant) {
      throw new Error('User is not a participant of this chat');
    }

    // Помечаем чат как удаленный
    return this.prisma.chat.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async leaveChat(id: number, userId: number) {
    return this.prisma.chatParticipant.updateMany({
      where: { chatId: id, userId, leftAt: null },
      data: { leftAt: new Date() },
    });
  }

  async addParticipant(chatId: number, userId: number) {
    return this.prisma.chatParticipant.create({
      data: {
        chatId,
        userId,
      },
    });
  }
}
