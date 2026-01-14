import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AboutUserOutputDto } from '@lumio/modules/user-accounts/users/api/dto/output/about-user.output.dto';
import { UnauthorizedDomainException } from '@libs/core/exceptions/domain-exceptions';
import { QueryUserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.query.repository';

export class AboutUserUserQuery {
  constructor(public readonly userId: number) {}
}

@QueryHandler(AboutUserUserQuery)
export class AboutUserQueryHandler implements IQueryHandler<
  AboutUserUserQuery,
  AboutUserOutputDto
> {
  constructor(private readonly userQueryRepository: QueryUserRepository) {}

  async execute(query: AboutUserUserQuery): Promise<AboutUserOutputDto | null> {
    const user = await this.userQueryRepository.getById(query.userId);

    if (!user) {
      throw UnauthorizedDomainException.create('Unauthorized', 'accessToken');
    }

    return new AboutUserOutputDto(user.id, user.username, user.email);
  }
}
