import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../users/infrastructure/repositories/user.repository';
import { CryptoService } from '../../../adapters/crypto.service';
import { ForbiddenDomainException } from '../../../../../../../../libs/core/exceptions/domain-exceptions';

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private cryptoService: CryptoService,
  ) {}
  async checkUserCredentials(email: string, password: string) {
    const user = await this.userRepository.findUserByEmail(email);
    if (!user) {
      throw ForbiddenDomainException.create(
        'The email must match the format example@example.com',
        'email',
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
