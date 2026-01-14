import { IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationParams } from '@libs/core/dto/pagination/base.query-params.input-dto';

const DEFAULT_POSTS_PAGE_SIZE = 4;

export class GetMainPageInputDto extends PaginationParams {
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) =>
    value ? Math.max(1, parseInt(value, 10)) : DEFAULT_POSTS_PAGE_SIZE,
  )
  pageSize: number = DEFAULT_POSTS_PAGE_SIZE;
}
