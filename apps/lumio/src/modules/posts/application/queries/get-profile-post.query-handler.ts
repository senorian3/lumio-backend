import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PostView, PostLikeView } from '../../api/dto/output/post.output.dto';
import { QueryPostRepository } from '../../domain/infrastructure/post.query.repository';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';

export class GetProfilePostQuery {
  constructor(
    public profileId: number,
    public postId: string,
    public currentUserId: number | null,
  ) {}
}

@QueryHandler(GetProfilePostQuery)
export class GetProfilePostQueryHandler implements IQueryHandler<
  GetProfilePostQuery,
  PostView
> {
  constructor(
    private readonly externalQueryUserAccountsRepository: ExternalQueryUserAccountsRepository,
    private readonly postQueryRepository: QueryPostRepository,
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

    const post = await this.postQueryRepository.findById(query.postId);

    if (!post || post.deletedAt !== null || post.userId !== profile.userId) {
      throw NotFoundDomainException.create('Post is not found', 'postId');
    }

    let currentUserReaction: 'like' | 'dislike' | 'none' = 'none';

    if (query.currentUserId) {
      const userReaction =
        await this.postQueryRepository.findUserReactionToPost(
          query.postId,
          query.currentUserId,
        );
      currentUserReaction = userReaction ?? 'none';
    }

    const newestLikesRaw =
      await this.postQueryRepository.findNewestLikesForPost(query.postId, 3);
    const newestLikes = newestLikesRaw.map((like) =>
      PostLikeView.fromPrisma(like),
    );

    return PostView.fromPrisma(post, currentUserReaction, newestLikes);
  }
}
