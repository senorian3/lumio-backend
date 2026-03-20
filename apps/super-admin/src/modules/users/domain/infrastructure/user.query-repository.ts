import { Injectable } from '@nestjs/common';
import { PrismaService } from '@super-admin/prisma/prisma.service';
import { UserWithProfileOutputDto } from '@super-admin/modules/users/api/dto/output/user-with-profile.output.dto';
import { FindManyOptionsInputDto } from '@super-admin/modules/users/api/dto/input/find-many-options.input.dto';

@Injectable()
export class UserQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<UserWithProfileOutputDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });

    return user as UserWithProfileOutputDto | null;
  }

  async findMany(
    options: FindManyOptionsInputDto,
  ): Promise<UserWithProfileOutputDto[]> {
    const users = await this.prisma.user.findMany({
      skip: options.skip,
      take: options.take,
      orderBy: {
        id: options.orderBy,
      },
      include: {
        profile: true,
      },
    });

    return users as UserWithProfileOutputDto[];
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }
}
