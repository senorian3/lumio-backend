import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { PostView } from './post.output.dto';

export class PaginatedPostViewDto extends PaginatedViewDto<PostView[]> {
  items: PostView[];
  role: string;

  constructor(
    items: PostView[],
    totalCount: number,
    page: number,
    pageSize: number,
    role: string,
  ) {
    super();
    this.items = items;
    this.totalCount = totalCount;
    this.pagesCount = Math.ceil(totalCount / pageSize);
    this.page = page;
    this.pageSize = pageSize;
    this.role = role;
  }
}
