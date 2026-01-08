import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@lumio/modules/user-accounts/auth/application/auth.service';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { CryptoService } from '@lumio/modules/user-accounts/adapters/crypto.service';
import { UserEntity } from '@lumio/modules/user-accounts/users/domain/entities/user.entity';
import { ForbiddenDomainException } from '@libs/core/exceptions/domain-exceptions';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let cryptoService: jest.Mocked<CryptoService>;

  const mockUser: UserEntity = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
    createdAt: new Date(),
    deletedAt: null,
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-01'),
    country: 'USA',
    city: 'New York',
    aboutMe: 'Test user',
    emailConfirmation: {
      id: 1,
      confirmationCode: 'code123',
      expirationDate: new Date(Date.now() + 10000),
      isConfirmed: true,
      userId: 1,
    },
    sessions: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findUserByEmail: jest.fn(),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            comparePasswords: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    cryptoService = module.get(CryptoService);
  });

  describe('checkUserCredentials', () => {
    it('should return user when credentials are valid', async () => {
      userRepository.findUserByEmail.mockResolvedValue(mockUser);
      cryptoService.comparePasswords.mockResolvedValue(true);

      const result = await authService.checkUserCredentials(
        'test@example.com',
        'password123',
      );

      expect(result).toEqual(mockUser);
      expect(userRepository.findUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(cryptoService.comparePasswords).toHaveBeenCalledWith(
        'password123',
        'hashedPassword123',
      );
    });

    it('should throw ForbiddenDomainException when user not found', async () => {
      userRepository.findUserByEmail.mockResolvedValue(null);

      await expect(
        authService.checkUserCredentials('nonexistent@example.com', 'password'),
      ).rejects.toThrow(ForbiddenDomainException);

      expect(userRepository.findUserByEmail).toHaveBeenCalledWith(
        'nonexistent@example.com',
      );
      expect(cryptoService.comparePasswords).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenDomainException when email is not confirmed', async () => {
      const unconfirmedUser = {
        ...mockUser,
        emailConfirmation: {
          ...mockUser.emailConfirmation!,
          isConfirmed: false,
        },
      };
      userRepository.findUserByEmail.mockResolvedValue(unconfirmedUser);

      await expect(
        authService.checkUserCredentials('test@example.com', 'password123'),
      ).rejects.toThrow(ForbiddenDomainException);

      expect(userRepository.findUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(cryptoService.comparePasswords).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenDomainException when password is incorrect', async () => {
      userRepository.findUserByEmail.mockResolvedValue(mockUser);
      cryptoService.comparePasswords.mockResolvedValue(false);

      await expect(
        authService.checkUserCredentials('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(ForbiddenDomainException);

      expect(userRepository.findUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(cryptoService.comparePasswords).toHaveBeenCalledWith(
        'wrongpassword',
        'hashedPassword123',
      );
    });
  });
});
