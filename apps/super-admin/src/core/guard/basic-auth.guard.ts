import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  private readonly validEmail =
    process.env.BASIC_AUTH_EMAIL || 'admin@gmail.com';
  private readonly validPassword = process.env.BASIC_AUTH_PASSWORD || 'admin';

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);
    const authHeader = request.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new GraphQLError('Unauthorized', {
        extensions: {
          code: 'Forbidden',
        },
      });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString(
      'utf-8',
    );
    const [email, password] = credentials.split(':');

    if (email === this.validEmail && password === this.validPassword) {
      return true;
    }

    throw new GraphQLError('Unauthorized', {
      extensions: {
        code: 'Forbidden',
      },
    });
  }

  private getRequest(context: ExecutionContext): Request {
    const http = context.switchToHttp();
    const httpRequest = http.getRequest<Request>();
    if (httpRequest?.headers) {
      return httpRequest;
    }
    const gqlContext = GqlExecutionContext.create(context);
    return gqlContext.getContext().req;
  }
}
