import { Prisma } from '@generated/prisma-lumio';

/**
 * Тип для пользователя с профилем (используя Prisma infer)
 * Включает все поля пользователя и связанный профиль
 */
export type UserWithProfile = Prisma.UserGetPayload<{
  include: { profile: true };
}>;

/**
 * Тип для профиля пользователя
 */
export type UserProfile = Prisma.UserProfileGetPayload<Record<string, never>>;

/**
 * Тип для базового пользователя (без профиля)
 */
export type User = Prisma.UserGetPayload<Record<string, never>>;

/**
 * Параметры для поиска нескольких пользователей
 * Используется в репозиториях
 */
export type FindManyOptions = {
  skip: number;
  take: number;
  orderBy: 'asc' | 'desc';
};

/**
 * Параметры пагинации
 */
export type PaginationParams = {
  page: number;
  limit: number;
};

/**
 * Результат пагинированного запроса
 */
export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};
