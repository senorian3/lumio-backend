import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import * as jwt from 'jsonwebtoken';
import { CoreConfig } from '../../core.config';

@Injectable()
export class SuperAdminJwtGuard implements CanActivate {
  constructor(private readonly coreConfig: CoreConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const request = this.getRequest(context);
    const authHeader = request.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new GraphQLError('Unauthorized', {
        extensions: {
          code: 'Forbidden',
        },
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(
        token,
        this.coreConfig.superAdminSecret,
      ) as jwt.JwtPayload;

      const issuedAt = decoded.iat;

      if (typeof issuedAt !== 'number') {
        throw new GraphQLError('Invalid token', {
          extensions: {
            code: 'Forbidden',
          },
        });
      }

      const expirationMs =
        this.coreConfig.superAdminTokenExpirationMinutes * 60 * 1000;
      const issuedAtMs = issuedAt * 1000;

      if (Date.now() - issuedAtMs > expirationMs) {
        throw new GraphQLError('Token expired', {
          extensions: {
            code: 'Forbidden',
          },
        });
      }

      return true;
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }

      throw new GraphQLError('Unauthorized', {
        extensions: {
          code: 'Forbidden',
        },
      });
    }
  }

  private getRequest(context: ExecutionContext) {
    const http = context.switchToHttp();
    const httpRequest = http.getRequest();
    if (httpRequest?.headers) {
      return httpRequest;
    }
    const gqlContext = GqlExecutionContext.create(context);
    return gqlContext.getContext().req;
  }
}
