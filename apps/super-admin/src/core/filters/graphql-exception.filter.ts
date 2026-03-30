import { Catch, HttpException } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch()
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  catch(exception: unknown): GraphQLError {
    if (exception instanceof GraphQLError) {
      const code = exception.extensions?.code;

      if (code === 'Forbidden' || code === 'UNAUTHENTICATED') {
        return exception;
      }

      return exception;
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : (response as Record<string, unknown>).message || exception.message;

      return new GraphQLError(String(message), {
        extensions: {
          code: exception.getStatus(),
        },
      });
    }

    return new GraphQLError('Internal server error', {
      extensions: {
        code: 500,
      },
    });
  }
}
