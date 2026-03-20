import { Injectable } from '@nestjs/common';
import { PrismaService } from '@super-admin/prisma/prisma.service';
import {
  UserWithProfile,
  FindManyOptions,
} from '@super-admin/modules/users/domain/types/user.types';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<UserWithProfile | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });
  }

  async findMany(options: FindManyOptions): Promise<UserWithProfile[]> {
    return this.prisma.user.findMany({
      skip: options.skip,
      take: options.take,
      orderBy: {
        id: options.orderBy,
      },
      include: {
        profile: true,
      },
    });
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }
}
