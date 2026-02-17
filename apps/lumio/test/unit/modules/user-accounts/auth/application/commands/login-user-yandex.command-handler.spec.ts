import { Test, TestingModule } from '@nestjs/testing';
import { LoginUserYandexCommandHandler } from '@lumio/modules/user-accounts/auth/application/commands/login-user-yandex.command-handler';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { CryptoService } from '@lumio/modules/user-accounts/adapters/crypto.service';
import { PrismaService } from '@lumio/prisma/prisma.service';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '@lumio/modules/user-accounts/constants/auth-tokens.inject-constants';

describe('LoginUserYandexUseCase', () => {
  let useCase: LoginUserYandexCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUserYandexCommandHandler,
        {
          provide: SessionRepository,
          useValue: {
            findSession: jest.fn(),
            updateSession: jest.fn(),
            createSession: jest.fn(),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            findYandexByYandexId: jest.fn(),
            findUserByEmail: jest.fn(),
            findUserById: jest.fn(),
            createUser: jest.fn(),
            createYandex: jest.fn(),
            updateYandex: jest.fn(),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            createPasswordHash: jest.fn(),
          },
        },
        {
          provide: ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((callback) => callback({})),
          },
        },
      ],
    }).compile();

    useCase = module.get<LoginUserYandexCommandHandler>(
      LoginUserYandexCommandHandler,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });
});
