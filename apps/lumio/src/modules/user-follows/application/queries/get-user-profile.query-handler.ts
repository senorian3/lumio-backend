import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserFollowQueryRepository } from '../../domain/infrastructure/user-follow.query-repository';
import { UserProfileViewDto } from '../../api/dto/output/user-profile.view-dto';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';

export class GetUserProfileQuery {
  constructor(
    public readonly currentUserId: number,
    public readonly targetUserId: number,
  ) {}
}

@QueryHandler(GetUserProfileQuery)
export class GetUserProfileQueryHandler implements IQueryHandler<
  GetUserProfileQuery,
  UserProfileViewDto
> {
  constructor(private readonly queryRepository: UserFollowQueryRepository) {}

  async execute(query: GetUserProfileQuery): Promise<UserProfileViewDto> {
    try {
      return await this.queryRepository.getUserProfile(
        query.currentUserId,
        query.targetUserId,
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        throw NotFoundDomainException.create('User not found', 'userId');
      }
      throw error;
    }
  }
}
