import { PrismaService } from '@lumio/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ExternalQueryUserAccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserId(id: number): Promise<number | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      return null;
    }

    return user.id;
  }

  async getProfileIdByUserId(userId: number): Promise<number | null> {
    const profile = await this.prisma.userProfile.findUnique({
      where: {
        userId,
      },
    });

    if (!profile) {
      return null;
    }

    return profile.id;
  }

  async getAllRegisteredUsersCount(): Promise<number> {
    return this.prisma.user.count();
  }
}
