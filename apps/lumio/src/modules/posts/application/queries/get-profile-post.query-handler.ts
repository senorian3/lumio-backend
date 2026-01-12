import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PostView } from '../../api/dto/output/post.output.dto';
import { PostRepository } from '../../domain/infrastructure/post.repository';
import { ExternalQueryUserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';

export class GetProfilePostQuery {
  constructor(
    public userId: number,
    public postId: number,
  ) {}
}

@QueryHandler(GetProfilePostQuery)
export class GetProfilePostQueryHandler implements IQueryHandler<
  GetProfilePostQuery,
  PostView
> {
  constructor(
    private readonly externalQueryUserRepository: ExternalQueryUserRepository,
    private readonly postRepository: PostRepository,
  ) {}

  async execute(query: GetProfilePostQuery): Promise<PostView> {
    const user = await this.externalQueryUserRepository.findById(query.userId);

    if (!user) {
      throw NotFoundDomainException.create('Profile is not found', 'userId');
    }

    if (!query.postId) {
      throw NotFoundDomainException.create('Post is not found', 'postId');
    }

    const post = await this.postRepository.findById(query.postId);

    if (!post || post.userId !== query.userId) {
      throw NotFoundDomainException.create('Post is not found', 'postId');
    }

    return PostView.fromPrisma(post);
  }
}
