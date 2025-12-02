import { CreateUserDto } from '../../dto/create-user.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { DomainException } from '../../../../../../../../libs/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../../../../libs/core/exceptions/domain-exception-codes';
import { CryptoService } from '../../../adapters/crypto.service';

export class CreateUserCommand {
  constructor(public dto: CreateUserDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase
  implements ICommandHandler<CreateUserCommand, number>
{
  constructor(
    private userRepository: UserRepository,
    private cryptoService: CryptoService,
  ) {}
  async execute({ dto }: CreateUserCommand): Promise<number> {
    const user = await this.userRepository.doesExistByUsernameOrEmail(
      dto.username,
      dto.email,
    );
    if (user) {
      throw new DomainException(
        'User already exists',
        DomainExceptionCode.BadRequest,
        [],
      );
    }

    const hashedPassword = await this.cryptoService.createPasswordHash(
      dto.password,
    );

    const newUser = await this.userRepository.createUser(dto, hashedPassword);

    return newUser.id;
  }
}
