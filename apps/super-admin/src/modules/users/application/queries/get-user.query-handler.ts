import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { User } from '@super-admin/modules/users/domain/schema/user/user.schema';
import { UserQueryRepository } from '@super-admin/modules/users/domain/infrastructure/user.query-repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { UserMapper } from '../mappers/user.mapper';

export class GetUserQuery {
  constructor(public readonly id: number) {}
}

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  private readonly userMapper = new UserMapper();

  constructor(
    private readonly userQueryRepository: UserQueryRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(query: GetUserQuery): Promise<User | null> {
    try {
      const userDto = await this.userQueryRepository.findById(query.id);

      if (!userDto) {
        return null;
      }

      return this.userMapper.mapFromDto(userDto);
    } catch (error) {
      this.logger.error(
        `Failed to get user by id: ${query.id}`,
        error?.stack,
        GetUserHandler.name,
      );
      return null;
    }
  }
}
