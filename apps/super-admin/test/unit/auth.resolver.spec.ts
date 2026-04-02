import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLError } from 'graphql';
import * as jwt from 'jsonwebtoken';
import { AuthResolver } from '@super-admin/modules/auth/api/auth.resolver';
import { CoreConfig } from '@super-admin/core/core.config';
import { LoginInput } from '@super-admin/modules/auth/api/schema/login.input';

describe('AuthResolver', () => {
  let resolver: AuthResolver;

  const mockCoreConfig = {
    superAdminEmail: 'admin@lumio.com',
    superAdminPassword: 'securePassword123',
    superAdminSecret: 'jwt-secret-key',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: CoreConfig,
          useValue: mockCoreConfig,
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('login', () => {
    it('should return access token for valid credentials', () => {
      const input: LoginInput = {
        email: 'admin@lumio.com',
        password: 'securePassword123',
      };

      const result = resolver.login(input);

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
      expect(result.accessToken.length).toBeGreaterThan(0);
    });

    it('should throw GraphQLError for invalid email', () => {
      const input: LoginInput = {
        email: 'wrong@email.com',
        password: 'securePassword123',
      };

      expect(() => resolver.login(input)).toThrow(GraphQLError);
      expect(() => resolver.login(input)).toThrow('Invalid email or password');
    });

    it('should throw GraphQLError for invalid password', () => {
      const input: LoginInput = {
        email: 'admin@lumio.com',
        password: 'wrongPassword',
      };

      expect(() => resolver.login(input)).toThrow(GraphQLError);
      expect(() => resolver.login(input)).toThrow('Invalid email or password');
    });

    it('should throw GraphQLError with Forbidden extension code', () => {
      const input: LoginInput = {
        email: 'wrong@email.com',
        password: 'wrongPassword',
      };

      try {
        resolver.login(input);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe('Forbidden');
      }
    });

    it('should generate JWT token with correct payload', () => {
      const input: LoginInput = {
        email: 'admin@lumio.com',
        password: 'securePassword123',
      };

      const result = resolver.login(input);

      // Verify token can be decoded
      const decoded = jwt.verify(
        result.accessToken,
        mockCoreConfig.superAdminSecret,
      );

      expect(decoded).toBeDefined();
      expect((decoded as any).role).toBe('super-admin');
      expect((decoded as any).iat).toBeDefined();
    });
  });
});
