import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { ExternalQuerySessionsRepository } from '@lumio/modules/sessions/domain/infrastructure/session.external-query.repository';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: ExternalQuerySessionsRepository,
          useValue: {
            getSessionByUserAndDeviceId: jest.fn(),
          },
        },
        {
          provide: ExternalQueryUserAccountsRepository,
          useValue: {
            isUserBlocked: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard', () => {
    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });
});
