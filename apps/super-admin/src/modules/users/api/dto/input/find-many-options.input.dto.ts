import { IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

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
}
