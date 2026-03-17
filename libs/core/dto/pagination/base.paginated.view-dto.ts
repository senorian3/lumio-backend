import { ApiProperty } from '@nestjs/swagger';

export abstract class PaginatedViewDto<T> {
  @ApiProperty({ type: [Object] }) // Добавьте декоратор для Swagger
  items: T;

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  pagesCount: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty({ example: 5, required: false })
  unreadCount?: number; // ✅ Новое поле

  public static mapToView<T>(data: {
    items: T;
    page: number;
    size: number;
    totalCount: number;
    unreadCount?: number;
  }): PaginatedViewDto<T> {
    return {
      pagesCount: Math.ceil(data.totalCount / data.size),
      page: data.page,
      pageSize: data.size,
      totalCount: data.totalCount,
      unreadCount: data.unreadCount,
      items: data.items,
    };
  }
}
