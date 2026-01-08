import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;

export class PaginationParams {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Transform(({ value }) =>
    value ? Math.max(1, parseInt(value, 10)) : DEFAULT_PAGE_NUMBER,
  )
  pageNumber: number = DEFAULT_PAGE_NUMBER;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Transform(({ value }) =>
    value ? Math.max(1, parseInt(value, 10)) : DEFAULT_PAGE_SIZE,
  )
  pageSize: number = DEFAULT_PAGE_SIZE;

  calculateSkip(): number {
    return (this.pageNumber - 1) * this.pageSize;
  }
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export abstract class BaseSortablePaginationParams<T> extends PaginationParams {
  @IsOptional()
  @IsEnum(SortDirection)
  @Transform(({ value }) =>
    value && Object.values(SortDirection).includes(value)
      ? value
      : SortDirection.Desc,
  )
  sortDirection: SortDirection = SortDirection.Desc;

  abstract sortBy: T;
}
