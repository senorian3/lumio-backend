import { ObjectType, Field, Int } from '@nestjs/graphql';
import { UserProfile } from '@super-admin/modules/users/domain/schema/user/user-profile.schema';

@ObjectType()
export class User {
  @Field(() => Int, { description: 'Уникальный идентификатор пользователя' })
  id: number;

  @Field({ description: 'Имя пользователя' })
  username: string;

  @Field({ description: 'Email пользователя' })
  email: string;

  @Field(() => Date, { nullable: true, description: 'Дата регистрации' })
  createdAt?: Date;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Заблокирован ли пользователь',
  })
  isBlocked?: boolean;

  @Field(() => Date, { nullable: true, description: 'Дата блокировки' })
  bannedAt?: Date;

  @Field({ nullable: true, description: 'Причина блокировки' })
  banReason?: string;

  @Field(() => UserProfile, {
    nullable: true,
    description: 'Профиль пользователя',
  })
  profile?: UserProfile;
}
