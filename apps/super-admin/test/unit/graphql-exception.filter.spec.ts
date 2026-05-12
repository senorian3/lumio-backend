import { GraphQLExceptionFilter } from '@super-admin/core/filters/graphql-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { GraphQLError } from 'graphql';

describe('GraphQLExceptionFilter', () => {
  let filter: GraphQLExceptionFilter;

  beforeEach(() => {
    filter = new GraphQLExceptionFilter();
  });

  describe('catch', () => {
    it('should pass through GraphQLError with Forbidden code', () => {
      const graphQlError = new GraphQLError('Forbidden resource', {
        extensions: { code: 'Forbidden' },
      });

      const result = filter.catch(graphQlError);

      expect(result).toBe(graphQlError);
      expect(result.message).toBe('Forbidden resource');
      expect(result.extensions?.code).toBe('Forbidden');
    });

    it('should pass through GraphQLError with UNAUTHENTICATED code', () => {
      const graphQlError = new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });

      const result = filter.catch(graphQlError);

      expect(result).toBe(graphQlError);
      expect(result.message).toBe('Not authenticated');
      expect(result.extensions?.code).toBe('UNAUTHENTICATED');
    });

    it('should pass through other GraphQLErrors', () => {
      const graphQlError = new GraphQLError('Some error', {
        extensions: { code: 'BAD_USER_INPUT' },
      });

      const result = filter.catch(graphQlError);

      expect(result).toBe(graphQlError);
    });

    it('should convert HttpException to GraphQLError', () => {
      const httpException = new HttpException(
        'Not Found',
        HttpStatus.NOT_FOUND,
      );

      const result = filter.catch(httpException);

      expect(result).toBeInstanceOf(GraphQLError);
      expect(result.message).toBe('Not Found');
      expect(result.extensions?.code).toBe(HttpStatus.NOT_FOUND);
    });

    it('should convert HttpException with object response to GraphQLError', () => {
      const httpException = new HttpException(
        { message: 'Validation failed', errors: [] },
        HttpStatus.BAD_REQUEST,
      );

      const result = filter.catch(httpException);

      expect(result).toBeInstanceOf(GraphQLError);
      expect(result.message).toBe('Validation failed');
      expect(result.extensions?.code).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should convert unknown exception to Internal Server Error', () => {
      const unknownError = new Error('Something went wrong');

      const result = filter.catch(unknownError);

      expect(result).toBeInstanceOf(GraphQLError);
      expect(result.message).toBe('Internal server error');
      expect(result.extensions?.code).toBe(500);
    });

    it('should convert string exception to Internal Server Error', () => {
      const result = filter.catch('string error');

      expect(result).toBeInstanceOf(GraphQLError);
      expect(result.message).toBe('Internal server error');
      expect(result.extensions?.code).toBe(500);
    });
  });
});
