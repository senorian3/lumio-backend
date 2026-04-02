import { IsOptional, IsInt, IsString, IsIn, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class GetAllPaymentsQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    return Array.isArray(value)
      ? value.map((v: any) => Number(v))
      : [Number(value)];
  })
  @IsInt({ each: true })
  profileIds?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  search?: string;
}
