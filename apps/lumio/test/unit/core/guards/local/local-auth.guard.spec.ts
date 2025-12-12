import { Test, TestingModule } from '@nestjs/testing';
import { LocalAuthGuard } from '@lumio/core/guards/local/local-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalAuthGuard],
    }).compile();

    guard = module.get<LocalAuthGuard>(LocalAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard', () => {
    expect(guard).toBeInstanceOf(LocalAuthGuard);
  });

  describe('canActivate', () => {
    it('should call super.canActivate', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: 'test@example.com',
              password: 'password123',
            },
          }),
        }),
      } as ExecutionContext;

      // Mock the parent canActivate method
      const mockCanActivate = jest.spyOn(guard as any, 'canActivate');
      mockCanActivate.mockResolvedValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockCanActivate).toHaveBeenCalledWith(context);
    });
  });
});
