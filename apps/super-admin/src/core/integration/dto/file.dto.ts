import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FileDto {
  @Field(() => ID)
  id: number;

  @Field()
  url: string;

  @Field()
  postId: string;

  constructor(data: Partial<FileDto>) {
    Object.assign(this, data);
  }
}
