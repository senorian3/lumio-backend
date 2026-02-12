import { Injectable } from '@nestjs/common';
import { ForbiddenDomainException } from '@libs/core/exceptions/domain-exceptions';
import { CryptoService } from '@lumio/modules/user-accounts/adapters/crypto.service';
import { UserRepository } from '../../users/domain/infrastructure/user.repository';
import { User } from 'generated/prisma-lumio';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cryptoService: CryptoService,
  ) {}
  async checkUserCredentials(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findUserByEmail(email);

    if (!user) {
      throw ForbiddenDomainException.create(
        'The email must match the format example@example.com',
        'email',
      );
    }

    if (!user.emailConfirmation?.isConfirmed) {
      throw ForbiddenDomainException.create(
        'User account is not confirmed',
        'confirmCode',
      );
    }

    const hash = user.password;

    const isPassCorrect = await this.cryptoService.comparePasswords(
      password,
      hash,
    );

    if (!isPassCorrect) {
      throw ForbiddenDomainException.create(
        'The email must match the format example@example.com',
        'email',
      );
    }

    return user;
  }
}
