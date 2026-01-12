import { PrismaService } from '@lumio/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ExternalQueryUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: number): Promise<number | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    return user.id;
  }

  async getAllRegisteredUsersCount(): Promise<number> {
    return this.prisma.user.count();
  }
}
