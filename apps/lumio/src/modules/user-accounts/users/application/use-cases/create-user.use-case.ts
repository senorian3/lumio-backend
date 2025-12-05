import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { CryptoService } from '@lumio/modules/user-accounts/adapters/crypto.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserDto } from '../../api/dto/transfer/create-user.dto';
import { UserRepository } from '../../infrastructure/user.repository';

export class CreateUserCommand {
  constructor(public createDto: CreateUserDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase
  implements ICommandHandler<CreateUserCommand, number>
{
  constructor(
    private userRepository: UserRepository,
    private cryptoService: CryptoService,
  ) {}
  async execute({ createDto }: CreateUserCommand): Promise<number> {
    const user = await this.userRepository.doesExistByUsernameOrEmail(
      createDto.username,
      createDto.email,
    );
    if (user) {
      throw BadRequestDomainException.create('User already exists');
    }

    const hashedPassword = await this.cryptoService.createPasswordHash(
      createDto.password,
    );

    const newUser = await this.userRepository.createUser(
      createDto,
      hashedPassword,
    );

    return newUser.id;
  }
}
