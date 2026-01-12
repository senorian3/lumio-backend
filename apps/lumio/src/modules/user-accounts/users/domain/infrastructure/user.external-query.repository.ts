import { PrismaService } from '@lumio/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ExternalQueryUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<number | null> {
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

  async getAllRegisteredUsersCount(): Promise<number> {
    return this.prisma.user.count();
  }
}
