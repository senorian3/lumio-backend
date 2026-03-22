import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@super-admin/modules/users/domain/infrastructure/user.repository';
import { GraphQLError } from 'graphql/index';
import { UpdateBanStatusDto } from '@super-admin/modules/users/api/dto/transfer/ban-user.transfer.dto';

export class BanUserCommand {
  constructor(
    public userId: number,
    public banReason: string,
  ) {}
}

@CommandHandler(BanUserCommand)
export class BanUserCommandHandler implements ICommandHandler<
  BanUserCommand,
  boolean
> {
  constructor(private readonly userRepository: UserRepository) {}
  async execute(command: BanUserCommand): Promise<boolean> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new GraphQLError('User not found', {
        extensions: {
          code: 'Not found',
        },
      });
    }

    const banDto: UpdateBanStatusDto = new UpdateBanStatusDto(
      true,
      new Date(),
      command.banReason,
    );

    await this.userRepository.updateBanStatus(command.userId, banDto);

    return true;
  }
}
