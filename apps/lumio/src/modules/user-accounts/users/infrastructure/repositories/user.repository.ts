import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { User } from '../../../../../../../../generated/prisma/client';
import { CreateUserDomainDto } from '../../domain/dto/create-user.domain.dto';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';
import { EmailConfirmation } from 'generated/prisma-lumio';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async doesExistByUsernameOrEmail(
    username: string,
    email: string,
  ): Promise<User | null> {
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
  ): Promise<User> {
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
}
