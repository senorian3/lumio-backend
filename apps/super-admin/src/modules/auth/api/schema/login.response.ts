import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class LoginResponse {
  @Field(() => String, { description: 'JWT access токен для авторизации' })
  accessToken: string;
}
