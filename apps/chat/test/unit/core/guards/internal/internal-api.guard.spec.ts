import { ExecutionContext } from '@nestjs/common';
import { InternalApiGuard } from '@chat/core/guards/internal/internal-api.guard';
import { CoreConfig } from '@chat/core/core.config';
import { DomainException } from '@libs/core/exceptions/domain-exceptions';

describe('InternalApiGuard', () => {
  let guard: InternalApiGuard;
  let coreConfig: jest.Mocked<CoreConfig>;

  const createMockContext = (
    headers: Record<string, string>,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    coreConfig = {
      internalApiKey: 'my-secret-key',
    } as jest.Mocked<CoreConfig>;

    guard = new InternalApiGuard(coreConfig);
  });

  it('allows request with valid internal API key', async () => {
    const context = createMockContext({
      'x-internal-api-key': 'my-secret-key',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rejects request with invalid internal API key', async () => {
    const context = createMockContext({
      'x-internal-api-key': 'wrong-key',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(DomainException);
  });

  it('rejects request with missing internal API key', async () => {
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(DomainException);
  });

  it('rejects request with empty internal API key', async () => {
    const context = createMockContext({ 'x-internal-api-key': '' });

    await expect(guard.canActivate(context)).rejects.toThrow(DomainException);
  });
});
