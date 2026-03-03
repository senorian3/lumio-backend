import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PostView } from '../../api/dto/output/post.output.dto';
import { PostRepository } from '../../domain/infrastructure/post.repository';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';

export class GetProfilePostQuery {
  constructor(
    public profileId: number,
    public postId: string,
  ) {}
}

@QueryHandler(GetProfilePostQuery)
export class GetProfilePostQueryHandler implements IQueryHandler<
  GetProfilePostQuery,
  PostView
> {
  constructor(
    private readonly externalQueryUserAccountsRepository: ExternalQueryUserAccountsRepository,
    private readonly postRepository: PostRepository,
  ) {}

  async execute(query: GetProfilePostQuery): Promise<PostView> {
    const profile =
      await this.externalQueryUserAccountsRepository.getProfileById(
        query.profileId,
      );

    if (!profile) {
      throw NotFoundDomainException.create('Profile is not found', 'profileId');
    }

    const user = await this.externalQueryUserAccountsRepository.findUserId(
      profile.userId,
    );

    if (!user) {
      throw NotFoundDomainException.create('User is not found', 'profileId');
    }

    if (!query.postId) {
      throw NotFoundDomainException.create('Post is not found', 'postId');
    }

    const post = await this.postRepository.findById(query.postId);

    if (!post || post.deletedAt !== null || post.userId !== profile.userId) {
      throw NotFoundDomainException.create('Post is not found', 'postId');
    }

    return PostView.fromPrisma(post);
  }
}
