import { PostView } from './post.output.dto';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';

export class MainPageView {
  constructor(
    public posts: PaginatedViewDto<PostView[]>,
    public allRegisteredUsersCount: number,
  ) {}
}
