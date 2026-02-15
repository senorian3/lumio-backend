import { Injectable } from '@nestjs/common';
import { PrismaService } from '@files/prisma/prisma.service';
import { UserAvatar } from 'generated/prisma-files';
import { CreateUserAvatarDto } from '@files/modules/avatar/domain/dto/create-user-avatar.domain.dto';

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUserAvatar(dto: CreateUserAvatarDto): Promise<UserAvatar> {
    return await this.prisma.userAvatar.create({
      data: {
        key: dto.key,
        url: dto.url,
        mimetype: dto.mimetype,
        size: dto.size,
        userId: dto.userId,
      },
    });
  }

  async updateAvatar(
    id: number,
    data: Partial<CreateUserAvatarDto>,
  ): Promise<UserAvatar> {
    return this.prisma.userAvatar.update({
      where: { id },
      data,
    });
  }

  async deleteAvatar(id: number): Promise<void> {
    await this.prisma.userAvatar.delete({ where: { id } });
  }

  async getAvatarByUserId(userId: number): Promise<UserAvatar | null> {
    return await this.prisma.userAvatar.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
