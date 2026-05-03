import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { UnauthorizedDomainException } from '@libs/core/exceptions/domain-exceptions';
import { InternalApiGuard } from '@files/core/guards/internal/internal-api.guard';
import { CoreConfig } from '@files/core/core.config';
import { Reflector } from '@nestjs/core';

describe('InternalApiGuard', () => {
  let guard: InternalApiGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockApiKey = 'test-api-key';

  const createMockContext = (
    apiKey?: string,
    service?: string,
  ): ExecutionContext => {
    const request = {
      headers: {
        'x-internal-api-key': apiKey,
        'x-internal-service': service,
      },
    } as any;

    return {
      getHandler: () => InternalApiGuard,
      getClass: () => InternalApiGuard,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['lumio']),
    } as unknown as jest.Mocked<Reflector>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InternalApiGuard,
        {
          provide: Reflector,
          useValue: reflector,
        },
        {
          provide: CoreConfig,
          useValue: {
            internalApiKey: mockApiKey,
            internalApiKeys: {
              lumio: mockApiKey,
              chat: 'chat-api-key',
            },
          },
        },
      ],
    }).compile();

    guard = module.get<InternalApiGuard>(InternalApiGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when valid service and API key are provided', async () => {
      // Arrange
      const context = createMockContext(mockApiKey, 'lumio');

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject request when service is missing', async () => {
      const context = createMockContext(mockApiKey, undefined as any);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedDomainException,
      );
    });

    it('should reject request when service is not allowed for endpoint', async () => {
      reflector.getAllAndOverride.mockReturnValue(['chat']);
      const context = createMockContext(mockApiKey, 'lumio');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedDomainException,
      );
    });

    it('should throw UnauthorizedDomainException when API key is missing', async () => {
      // Arrange
      const context = createMockContext(undefined, 'lumio');

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedDomainException,
      );

      try {
        await guard.canActivate(context);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Unauthorized');
        expect(error.extensions[0]?.message).toBe(
          'Internal API key is missing',
        );
        expect(error.extensions[0]?.field).toBe('internal-api');
      }
    });

    it('should throw UnauthorizedDomainException when API key is invalid', async () => {
      // Arrange
      const context = createMockContext('invalid-key', 'lumio');

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedDomainException,
      );

      try {
        await guard.canActivate(context);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Unauthorized');
        expect(error.extensions[0]?.message).toBe('Invalid internal API key');
        expect(error.extensions[0]?.field).toBe('internal-api');
      }
    });

    it('should throw UnauthorizedDomainException when API key is empty string', async () => {
      // Arrange
      const context = createMockContext('', 'lumio');

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedDomainException,
      );
    });
  });
});
