import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { UnauthorizedDomainException } from '@libs/core/exceptions/domain-exceptions';
import { InternalApiGuard } from '@payments/core/guards/internal/internal-api.guard';
import { CoreConfig } from '@payments/core/core.config';

describe('InternalApiGuard', () => {
  let guard: InternalApiGuard;

  const mockApiKey = 'test-api-key';

  const createMockContext = (apiKey?: string): ExecutionContext => {
    const request = {
      headers: {
        'x-internal-api-key': apiKey,
      },
    } as any;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InternalApiGuard,
        {
          provide: CoreConfig,
          useValue: {
            internalApiKey: mockApiKey,
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
    it('should return true when valid API key is provided', async () => {
      // Arrange
      const context = createMockContext(mockApiKey);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedDomainException when API key is missing', async () => {
      // Arrange
      const context = createMockContext(undefined);

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
      const context = createMockContext('invalid-key');

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
      const context = createMockContext('');

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedDomainException,
      );
    });
  });
});
