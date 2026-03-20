import { Field, Int, ArgsType } from '@nestjs/graphql';
import { SortDirection } from './sort-direction.enum';

@ArgsType()
export class PaginationInput {
  @Field(() => Int)
  pageNumber: number;

  @Field(() => Int)
  pageSize: number;

  @Field(() => SortDirection, { defaultValue: 'ASC' })
  sortDirection: SortDirection;
}
