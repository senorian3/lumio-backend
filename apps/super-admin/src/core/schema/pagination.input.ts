import { InputType, Field, Int } from '@nestjs/graphql';
import { SortDirection } from './sort-direction.enum';

@InputType()
export class PaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  pageNumber: number;

  @Field(() => Int, { defaultValue: 10 })
  pageSize: number;

  @Field(() => SortDirection, { defaultValue: 'ASC' })
  sortDirection: SortDirection;
}
