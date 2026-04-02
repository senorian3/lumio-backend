import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User } from '@super-admin/modules/users/domain/schema/user/user.schema';
import { PostFile } from '@super-admin/modules/posts/domain/schema/post/post-file.schema';

@ObjectType()
export class Post {
  @Field({ description: 'Уникальный идентификатор поста' })
  id: string;

  @Field({ nullable: true, description: 'Описание поста' })
  description: string | null;

  @Field({ description: 'Дата создания' })
  createdAt: Date;

  @Field({ nullable: true, description: 'Дата удаления' })
  deletedAt: Date | null;

  @Field(() => Int, { description: 'ID автора поста' })
  userId: number;

  @Field(() => User, { description: 'Автор поста' })
  user: User;

  @Field(() => [PostFile], { description: 'Файлы поста' })
  files: PostFile[];
}
