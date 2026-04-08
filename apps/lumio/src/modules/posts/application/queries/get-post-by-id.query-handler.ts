import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  PostView,
  PostLikeView,
} from '@lumio/modules/posts/api/dto/output/post.output.dto';
import { QueryPostRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';

export class GetPostByIdQuery {
  constructor(
    public readonly postId: string,
    public readonly userId: number,
  ) {}
}

@QueryHandler(GetPostByIdQuery)
export class GetPostByIdQueryHandler implements IQueryHandler<
  GetPostByIdQuery,
  PostView
> {
  constructor(
    private readonly queryPostRepository: QueryPostRepository,
    private readonly externalQueryUserAccountsRepository: ExternalQueryUserAccountsRepository,
  ) {}

  async execute(query: GetPostByIdQuery): Promise<PostView> {
    const user = await this.externalQueryUserAccountsRepository.findUserId(
      query.userId,
    );

    if (!user) {
      throw NotFoundDomainException.create('Profile is not found', 'userId');
    }

    const post = await this.queryPostRepository.findById(query.postId);

    if (!post) {
      throw NotFoundDomainException.create('Post does not exist', 'post');
    }

    const userReaction = await this.queryPostRepository.findUserReactionToPost(
      query.postId,
      query.userId,
    );

    const newestLikesRaw =
      await this.queryPostRepository.findNewestLikesForPost(query.postId, 3);
    const newestLikes = newestLikesRaw.map((like) =>
      PostLikeView.fromPrisma(like),
    );

    return PostView.fromPrisma(post, userReaction ?? 'none', newestLikes);
  }
}
