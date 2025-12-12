import { CryptoService } from '@lumio/modules/user-accounts/adapters/crypto.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserDto } from '../../api/dto/transfer/create-user.dto';
import { UserRepository } from '../../domain/infrastructure/user.repository';

export class CreateUserCommand {
  constructor(public createDto: CreateUserDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase
  implements ICommandHandler<CreateUserCommand, number>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cryptoService: CryptoService,
  ) {}
  async execute({ createDto }: CreateUserCommand): Promise<number> {
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
