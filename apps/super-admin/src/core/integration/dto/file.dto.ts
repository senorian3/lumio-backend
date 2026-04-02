import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FileDto {
  @Field(() => ID, { description: 'Уникальный идентификатор файла' })
  id: number;

  @Field({ description: 'URL файла' })
  url: string;

  @Field({ description: 'ID поста' })
  postId: string;

  constructor(data: Partial<FileDto>) {
    Object.assign(this, data);
  }
}
