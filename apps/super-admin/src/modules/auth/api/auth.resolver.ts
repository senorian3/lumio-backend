import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import * as jwt from 'jsonwebtoken';
import { CoreConfig } from '@super-admin/core/core.config';
import { LoginInput } from './schema/login.input';
import { LoginResponse } from './schema/login.response';

@Resolver()
export class AuthResolver {
  constructor(private readonly coreConfig: CoreConfig) {}

  @Mutation(() => LoginResponse, { name: 'login' })
  login(@Args('input') input: LoginInput): LoginResponse {
    if (
      input.email !== this.coreConfig.superAdminEmail ||
      input.password !== this.coreConfig.superAdminPassword
    ) {
      throw new GraphQLError('Invalid email or password', {
        extensions: {
          code: 'Forbidden',
        },
      });
    }

    const issuedAt = Math.floor(Date.now() / 1000);

    const token = jwt.sign(
      { iat: issuedAt, role: 'super-admin' },
      this.coreConfig.superAdminSecret,
    );

    return { accessToken: token };
  }
}
