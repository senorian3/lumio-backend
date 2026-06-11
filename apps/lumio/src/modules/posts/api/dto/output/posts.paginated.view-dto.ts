import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { PostView } from './post.output.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PaginatedPostViewDto extends PaginatedViewDto<PostView[]> {
  @ApiProperty({ type: [PostView] })
  items: PostView[];

  @ApiProperty({
    enum: ['author', 'viewer'],
    example: 'viewer',
    description: 'Current user role relative to the profile owner',
  })
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
