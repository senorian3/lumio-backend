import { Injectable } from '@nestjs/common';
import { PrismaService } from '@files/prisma/prisma.service';
import { ChatFileEntity } from '../entities/chat-file.entity';

interface CreateChatFileDto {
  key: string;
  url: string;
  type: string;
  size: number;
  userId: number;
  chatId: number;
  messageId: string;
  originalName: string;
  mimeType: string;
}

@Injectable()
export class ChatFileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChatFileDto): Promise<ChatFileEntity> {
    return this.prisma.chatFile.create({
      data: {
        key: dto.key,
        url: dto.url,
        type: dto.type,
        size: dto.size,
        userId: dto.userId,
        chatId: dto.chatId,
        messageId: dto.messageId,
        originalName: dto.originalName,
        mimeType: dto.mimeType,
      },
    });
  }

  async findByKey(key: string): Promise<ChatFileEntity | null> {
    return this.prisma.chatFile.findFirst({
      where: {
        key,
        deletedAt: null,
      },
    });
  }

  async findByMessageId(messageId: string): Promise<ChatFileEntity[]> {
    return this.prisma.chatFile.findMany({
      where: {
        messageId,
        deletedAt: null,
      },
    });
  }

  async findByChatId(chatId: number): Promise<ChatFileEntity[]> {
    return this.prisma.chatFile.findMany({
      where: {
        chatId,
        deletedAt: null,
      },
    });
  }

  async softDeleteByKey(key: string): Promise<void> {
    await this.prisma.chatFile.update({
      where: { key },
      data: { deletedAt: new Date() },
    });
  }

  async softDeleteByMessageId(messageId: string): Promise<void> {
    await this.prisma.chatFile.updateMany({
      where: { messageId },
      data: { deletedAt: new Date() },
    });
  }
}
