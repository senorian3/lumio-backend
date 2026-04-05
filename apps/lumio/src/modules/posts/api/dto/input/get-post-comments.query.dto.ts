// @lumio/modules/posts/api/dto/input/get-post-comments.query.dto.ts
import { IsEnum, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BaseSortablePaginationParams } from '@libs/core/dto/pagination/base.query-params.input-dto';

export enum CommentSortField {
  CreatedAt = 'createdAt',
  LikeCount = 'likeCount',
  DislikeCount = 'dislikeCount',
}

export class GetPostCommentsQueryDto extends BaseSortablePaginationParams<CommentSortField> {
  @ApiProperty({
    description: 'Поле сортировки',
    example: 'createdAt',
    required: false,
    enum: CommentSortField,
  })
  @IsOptional()
  @IsEnum(CommentSortField)
  @Transform(({ value }) => value || CommentSortField.CreatedAt)
  sortBy: CommentSortField = CommentSortField.CreatedAt;

  @ApiProperty({ description: 'Размер страницы', example: 20, required: false })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => (value ? Math.max(1, parseInt(value, 10)) : 20))
  pageSize: number = 20;
}
