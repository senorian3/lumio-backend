import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ProfileView } from '../../api/dto/output/profile.output.dto';

export class GetProfileQuery {
  constructor(public userId: number) {}
}

@QueryHandler(GetProfileQuery)
export class GetProfileQueryHandler implements IQueryHandler<
  GetProfileQuery,
  ProfileView
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetProfileQuery): Promise<ProfileView> {
    const user = await this.userRepository.findUserById(query.userId);

    if (!user) {
      throw NotFoundDomainException.create('Profile is not found', 'userId');
    }

    return ProfileView.fromEntity(user);
  }
}
