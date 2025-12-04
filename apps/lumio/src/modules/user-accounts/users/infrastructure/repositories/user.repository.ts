import { PrismaService } from '@lumio/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';
import { EmailConfirmation } from 'generated/prisma-lumio';
import { UserEntity } from '../../domain/entities/user.entity';
import { CreateUserDomainDto } from '../../domain/dto/create-user.domain.dto';

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
  ): Promise<UserEntity> {
    return this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: passwordHash,
        emailConfirmation: {
          create: {
            isConfirmed: false,
            confirmationCode: randomUUID(),
            expirationDate: add(new Date(), { days: 7 }),
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
}
