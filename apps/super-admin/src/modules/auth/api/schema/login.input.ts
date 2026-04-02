import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType()
export class LoginInput {
  @Field(() => String, { description: 'Email администратора' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field(() => String, { description: 'Пароль администратора' })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  password: string;
}
