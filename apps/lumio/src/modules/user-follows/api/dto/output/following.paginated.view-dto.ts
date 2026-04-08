import { Expose } from 'class-transformer';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { FollowingViewDto } from './following.view-dto';

export class PaginatedFollowingViewDto extends PaginatedViewDto<
  FollowingViewDto[]
> {
  @Expose()
  items: FollowingViewDto[];
}
