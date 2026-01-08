import { PrismaService } from '@lumio/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';
import { EmailConfirmation, User } from 'generated/prisma-lumio';
import { CreateUserDomainDto } from '../dto/create-user.domain.dto';
import { UserEntity } from '../entities/user.entity';
import { YandexEntity } from '@lumio/modules/user-accounts/users/domain/entities/yandex.entity';
import { EditProfileTransferDto } from '@lumio/modules/user-accounts/profile/api/dto/transfer/edit-profile.transfer-dto';
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async doesExistByUsernameOrEmail(
    username: string,
    email: string,
  ): Promise<UserEntity | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { username, deletedAt: null },
          { email, deletedAt: null },
        ],
      },
    });
  }

  async createUser(
    dto: CreateUserDomainDto,
    passwordHash: string,
    isConfirmed?: boolean,
  ): Promise<UserEntity> {
    return this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: passwordHash,
        emailConfirmation: {
          create: {
            isConfirmed: isConfirmed ?? false,
            confirmationCode: randomUUID(),
            expirationDate: add(new Date(), { hours: 1 }),
          },
        },
      },
      include: {
        emailConfirmation: true,
      },
    });
  }

  async findByCodeOrIdEmailConfirmation({
    code,
    userId,
  }: {
    code?: string;
    userId?: number;
  }): Promise<EmailConfirmation | null> {
    if (!code && !userId) {
      return null;
    }

    return this.prisma.emailConfirmation.findFirst({
      where: code ? { confirmationCode: code } : { userId: userId! },
      include: {
        user: true,
      },
    });
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findFirst({
      where: {
        email: email,
      },
      include: {
        emailConfirmation: true,
      },
    });
  }

  async updateCodeAndExpirationDate(
    userId: number,
    newConfirmationCode: string,
    newExpirationDate: Date,
  ): Promise<void> {
    await this.prisma.emailConfirmation.update({
      where: { userId },
      data: {
        confirmationCode: newConfirmationCode,
        expirationDate: newExpirationDate,
        isConfirmed: false,
      },
    });
  }

  async updatePassword(userId: number, newPasswordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: newPasswordHash,
      },
    });
  }

  async findUserById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        emailConfirmation: true,
        sessions: true,
      },
    });
  }

  async confirmEmail(userId: number): Promise<void> {
    await this.prisma.emailConfirmation.update({
      where: { userId },
      data: {
        isConfirmed: true,
      },
    });
  }

  async deleteExpiredUserRegistration(date: Date): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany({
        where: {
          emailConfirmation: {
            isConfirmed: false,
            expirationDate: { lte: date },
          },
        },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);
      await tx.emailConfirmation.deleteMany({
        where: { userId: { in: userIds } },
      });
      await tx.user.deleteMany({
        where: { id: { in: userIds } },
      });
    });
  }

  async findYandexByYandexId(yandexId: string): Promise<YandexEntity | null> {
    return this.prisma.yandex.findUnique({
      where: { yandexId },
      include: {
        user: true,
      },
    });
  }

  async createYandex(data: {
    yandexId: string;
    email: string;
    username: string;
    userId: number;
  }) {
    return this.prisma.yandex.create({
      data: {
        yandexId: data.yandexId,
        email: data.email,
        username: data.username,
        userId: data.userId,
      },
    });
  }

  async updateYandex(
    id: number,
    data: {
      userId?: number;
      email?: string;
      username?: string;
    },
  ): Promise<void> {
    await this.prisma.yandex.update({
      where: { id },
      data,
    });
  }

  async getRegisteredUsersCount(): Promise<number> {
    return this.prisma.user.count();
  }

  async updateUserProfile(
    userId: number,
    dto: EditProfileTransferDto,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        country: dto.country,
        city: dto.city,
        aboutMe: dto.aboutMe,
      },
    });
  }
}
