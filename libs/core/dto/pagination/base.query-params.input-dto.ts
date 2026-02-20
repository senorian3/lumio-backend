import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;

export class PaginationParams {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Transform(({ value }) =>
    value ? Math.max(1, parseInt(value, 10)) : DEFAULT_PAGE_NUMBER,
  )
  pageNumber: number = DEFAULT_PAGE_NUMBER;

  @ApiProperty({
    description: 'Page size',
    example: 10,
    required: false,
    minimum: 1,
  })
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
  @ApiProperty({
    description: 'Sort direction',
    example: 'desc',
    required: false,
    enum: SortDirection,
  })
  @IsOptional()
  @IsEnum(SortDirection)
  @Transform(({ value }) =>
    value && Object.values(SortDirection).includes(value)
      ? value
      : SortDirection.Desc,
  )
  sortDirection: SortDirection = SortDirection.Desc;

  @ApiProperty({
    description: 'Sort by field',
    example: 'createdAt',
    required: false,
    enum: ['createdAt'],
  })
  abstract sortBy: T;
}
