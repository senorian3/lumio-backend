import { ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { WsJwtGuard } from '@chat/core/guards/ws-jwt.guard';

describe('WsJwtGuard', () => {
  let guard: WsJwtGuard;

  const createMockContext = (userId?: number): ExecutionContext =>
    ({
      switchToWs: () => ({
        getClient: () => ({
          data: { userId },
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    guard = new WsJwtGuard();
  });

  it('allows a socket with an authenticated user', async () => {
    const context = createMockContext(42);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('rejects a socket without an authenticated user', async () => {
    const context = createMockContext(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(WsException);
  });
});
