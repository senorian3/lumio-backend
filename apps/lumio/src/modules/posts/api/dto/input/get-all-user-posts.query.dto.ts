import { BaseSortablePaginationParams } from '@libs/core/dto/pagination/base.query-params.input-dto';
import { Transform } from 'class-transformer';
import { IsOptional, IsEnum } from 'class-validator';

export enum PostsSortBy {
  CREATED_AT = 'createdAt',
  DESCRIPTION = 'description',
}

export class GetPostsQueryParams extends BaseSortablePaginationParams<PostsSortBy> {
  @IsOptional()
  @IsEnum(PostsSortBy)
  @Transform(({ value }) => {
    if (!value) return PostsSortBy.CREATED_AT;
    const upperValue = value.toString().toUpperCase();
    return (
      Object.values(PostsSortBy).find(
        (v) =>
          v.toUpperCase() === upperValue ||
          v.replace('_', '').toUpperCase() === upperValue,
      ) || PostsSortBy.CREATED_AT
    );
  })
  sortBy: PostsSortBy = PostsSortBy.CREATED_AT;
}
