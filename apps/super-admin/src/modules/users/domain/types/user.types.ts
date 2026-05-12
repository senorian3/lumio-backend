import { Prisma } from '@generated/prisma-lumio';

export type UserWithProfile = Prisma.UserGetPayload<{
  include: { profile: true };
}>;

export type UserProfile = Prisma.UserProfileGetPayload<Record<string, never>>;

export type User = Prisma.UserGetPayload<Record<string, never>>;

export type FindManyOptions = {
  skip: number;
  take: number;
  orderBy: 'asc' | 'desc';
};

export type PaginationParams = {
  page: number;
  limit: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};
