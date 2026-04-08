import { Expose } from 'class-transformer';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { FollowerViewDto } from './follower.view-dto';

export class PaginatedFollowersViewDto extends PaginatedViewDto<
  FollowerViewDto[]
> {
  @Expose()
  items: FollowerViewDto[];
}
