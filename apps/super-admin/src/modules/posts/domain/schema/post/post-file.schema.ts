import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Post } from '@super-admin/modules/posts/domain/schema/post/post.schema';

@ObjectType()
export class PostFile {
  @Field(() => Int, { description: 'Уникальный идентификатор файла' })
  id: number;

  @Field({ description: 'ID поста' })
  postId: string;

  @Field({ description: 'URL файла' })
  url: string;

  @Field({ description: 'Дата создания' })
  createdAt: Date;

  @Field({ nullable: true, description: 'Дата удаления' })
  deletedAt: Date | null;

  @Field(() => Post, {
    nullable: true,
    description: 'Пост, к которому относится файл',
  })
  post?: Post;
}
