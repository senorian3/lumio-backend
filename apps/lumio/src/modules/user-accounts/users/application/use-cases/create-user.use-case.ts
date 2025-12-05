import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { CryptoService } from '@lumio/modules/user-accounts/adapters/crypto.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UserRepository } from '../../infrastructure/user.repository';

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
      throw BadRequestDomainException.create('User already exists');
    }

    const hashedPassword = await this.cryptoService.createPasswordHash(
      dto.password,
    );

    const newUser = await this.userRepository.createUser(dto, hashedPassword);

    return newUser.id;
  }
}
