import { IsNumber, IsEnum, Min, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { UserSortBy } from '@super-admin/core/schema/user-sort-by.enum';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class FindManyOptionsInputDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  skip: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  take: number;

  @IsEnum(SortOrder)
  orderBy: SortOrder;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserSortBy)
  sortBy?: UserSortBy;
}
