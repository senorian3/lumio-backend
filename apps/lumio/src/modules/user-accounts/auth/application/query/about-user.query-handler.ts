import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AboutUserOutputDto } from '@lumio/modules/user-accounts/users/api/dto/output/about-user.output-dto';
import { UserQueryRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.query.repository';
import { UnauthorizedDomainException } from '@libs/core/exceptions/domain-exceptions';

export class AboutUserUserQuery {
  constructor(public readonly userId: number) {}
}

@QueryHandler(AboutUserUserQuery)
export class AboutUserQueryHandler implements IQueryHandler<
  AboutUserUserQuery,
  AboutUserOutputDto
> {
  constructor(private userQueryRepository: UserQueryRepository) {}

  async execute(query: AboutUserUserQuery): Promise<AboutUserOutputDto | null> {
    const user = await this.userQueryRepository.findById(query.userId);

    if (!user) {
      throw UnauthorizedDomainException.create('Unauthorized', 'accessToken');
    }

    return new AboutUserOutputDto(user.id, user.username, user.email);
  }
}
