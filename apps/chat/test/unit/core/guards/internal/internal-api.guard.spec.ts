import { ExecutionContext } from '@nestjs/common';
import { InternalApiGuard } from '@chat/core/guards/internal/internal-api.guard';
import { CoreConfig } from '@chat/core/core.config';
import { DomainException } from '@libs/core/exceptions/domain-exceptions';
import { Reflector } from '@nestjs/core';

describe('InternalApiGuard', () => {
  let guard: InternalApiGuard;
  let coreConfig: jest.Mocked<CoreConfig>;
  let reflector: jest.Mocked<Reflector>;

  const createMockContext = (
    headers: Record<string, string>,
  ): ExecutionContext =>
    ({
      getHandler: () => InternalApiGuard,
      getClass: () => InternalApiGuard,
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    coreConfig = {
      internalApiKey: 'my-secret-key',
      internalApiKeys: {
        lumio: 'lumio-secret-key',
      },
    } as unknown as jest.Mocked<CoreConfig>;
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['lumio']),
    } as unknown as jest.Mocked<Reflector>;

    guard = new InternalApiGuard(coreConfig, reflector);
  });

  it('allows request with valid internal service and API key', async () => {
    const context = createMockContext({
      'x-internal-service': 'lumio',
      'x-internal-api-key': 'lumio-secret-key',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rejects request with missing internal service', async () => {
    const context = createMockContext({
      'x-internal-api-key': 'lumio-secret-key',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(DomainException);
  });

  it('rejects request from service that is not allowed for endpoint', async () => {
    reflector.getAllAndOverride.mockReturnValue(['super-admin']);
    const context = createMockContext({
      'x-internal-service': 'lumio',
      'x-internal-api-key': 'lumio-secret-key',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(DomainException);
  });

  it('rejects request with invalid internal API key', async () => {
    const context = createMockContext({
      'x-internal-service': 'lumio',
      'x-internal-api-key': 'wrong-key',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(DomainException);
  });

  it('rejects request with missing internal API key', async () => {
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(DomainException);
  });

  it('rejects request with empty internal API key', async () => {
    const context = createMockContext({
      'x-internal-service': 'lumio',
      'x-internal-api-key': '',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(DomainException);
  });
});
