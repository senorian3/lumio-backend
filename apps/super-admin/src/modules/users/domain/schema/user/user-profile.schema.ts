import { ObjectType, Field, Int } from '@nestjs/graphql';
import { AccountType } from './account-type.enum';

@ObjectType()
export class UserProfile {
  @Field(() => Int, { description: 'Уникальный идентификатор профиля' })
  id: number;

  @Field({ nullable: true, description: 'Имя' })
  firstName?: string;

  @Field({ nullable: true, description: 'Фамилия' })
  lastName?: string;

  @Field({ nullable: true, description: 'Дата рождения' })
  dateOfBirth?: Date;

  @Field({ nullable: true, description: 'Страна' })
  country?: string;

  @Field({ nullable: true, description: 'Город' })
  city?: string;

  @Field({ nullable: true, description: 'О себе' })
  aboutMe?: string;

  @Field({ nullable: true, description: 'URL аватара' })
  avatarUrl?: string;

  @Field({ description: 'Заполнен ли профиль' })
  profileFilled: boolean;

  @Field({ nullable: true, description: 'Дата заполнения профиля' })
  profileFilledAt?: Date;

  @Field({ nullable: true, description: 'Дата обновления профиля' })
  profileUpdatedAt?: Date;

  @Field(() => AccountType, { description: 'Тип аккаунта' })
  accountType: AccountType;
}
