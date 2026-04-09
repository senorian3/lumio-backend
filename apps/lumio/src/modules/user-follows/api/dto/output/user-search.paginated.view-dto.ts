import { Expose } from 'class-transformer';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { UserSearchViewDto } from './user-search.view-dto';

export class PaginatedUserSearchViewDto extends PaginatedViewDto<
  UserSearchViewDto[]
> {
  @Expose()
  items: UserSearchViewDto[];
}
