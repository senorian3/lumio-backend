import { UserEntity } from '@lumio/modules/user-accounts/users/domain/entities/user.entity';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: number): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        emailConfirmation: true,
      },
    });

    return user;
  }
}
