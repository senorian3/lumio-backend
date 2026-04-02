import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@super-admin/modules/users/domain/infrastructure/user.repository';
import { GraphQLError } from 'graphql/index';

export class DeletedUserCommand {
  constructor(public userId: number) {}
}

@CommandHandler(DeletedUserCommand)
export class DeletedUserCommandHandler implements ICommandHandler<
  DeletedUserCommand,
  boolean
> {
  constructor(private readonly userRepository: UserRepository) {}
  async execute(command: DeletedUserCommand): Promise<boolean> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new GraphQLError('User not found', {
        extensions: {
          code: 'Not found',
        },
      });
    }

    await this.userRepository.softDeletedUserById(command.userId);

    return true;
  }
}
