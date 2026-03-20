import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

export function PaginatedResponse<T>(classRef: Type<T>): any {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedResponseClass {
    @Field(() => Int)
    page: number;

    @Field(() => Int)
    pageSize: number;

    @Field(() => Int)
    pagesCount: number;

    @Field(() => Int)
    totalCount: number;

    @Field(() => [classRef])
    items: T[];
  }
  return PaginatedResponseClass;
}
