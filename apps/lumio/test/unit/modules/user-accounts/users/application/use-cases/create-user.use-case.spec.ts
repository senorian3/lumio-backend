import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateUserUseCase,
  CreateUserCommand,
} from '@lumio/modules/user-accounts/users/application/use-cases/create-user.use-case';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { CryptoService } from '@lumio/modules/user-accounts/adapters/crypto.service';
import { CreateUserDto } from '@lumio/modules/user-accounts/users/api/dto/transfer/create-user.transfer.dto';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: UserRepository;
  let mockCryptoService: CryptoService;

  const mockCreateDto = new CreateUserDto(
    'testuser',
    'Password123',
    'test@example.com',
  );

  const mockHashedPassword = 'hashedPassword123';
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: mockHashedPassword,
    createdAt: new Date(),
    deletedAt: null,
    emailConfirmation: {
      id: 1,
      userId: 1,
      confirmationCode: '123456',
      isConfirmed: false,
      expirationDate: new Date(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        {
          provide: UserRepository,
          useValue: {
            createUser: jest.fn(),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            createPasswordHash: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<CreateUserUseCase>(CreateUserUseCase);
    mockUserRepository = module.get<UserRepository>(UserRepository);
    mockCryptoService = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create user successfully', async () => {
      // Arrange
      const command = new CreateUserCommand(mockCreateDto);
      (mockCryptoService.createPasswordHash as jest.Mock).mockResolvedValue(
        mockHashedPassword,
      );
      (mockUserRepository.createUser as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockCryptoService.createPasswordHash).toHaveBeenCalledWith(
        mockCreateDto.password,
      );
      expect(mockUserRepository.createUser).toHaveBeenCalledWith(
        mockCreateDto,
        mockHashedPassword,
      );
      expect(result).toBe(mockUser.id);
    });

    it('should handle database error when creating user', async () => {
      // Arrange
      const command = new CreateUserCommand(mockCreateDto);
      const dbError = new Error('Cannot insert into users table');
      (mockCryptoService.createPasswordHash as jest.Mock).mockResolvedValue(
        mockHashedPassword,
      );
      (mockUserRepository.createUser as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(dbError);
      expect(mockCryptoService.createPasswordHash).toHaveBeenCalledWith(
        mockCreateDto.password,
      );
      expect(mockUserRepository.createUser).toHaveBeenCalledWith(
        mockCreateDto,
        mockHashedPassword,
      );
    });

    it('should handle crypto service error when hashing password', async () => {
      // Arrange
      const command = new CreateUserCommand(mockCreateDto);
      const cryptoError = new Error('Password hashing failed');
      (mockCryptoService.createPasswordHash as jest.Mock).mockRejectedValue(
        cryptoError,
      );

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(cryptoError);
      expect(mockCryptoService.createPasswordHash).toHaveBeenCalledWith(
        mockCreateDto.password,
      );
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
    });

    it('should handle empty password', async () => {
      // Arrange
      const command = new CreateUserCommand(
        new CreateUserDto('testuser', '', 'test@example.com'),
      );
      (mockCryptoService.createPasswordHash as jest.Mock).mockResolvedValue(
        mockHashedPassword,
      );
      (mockUserRepository.createUser as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockCryptoService.createPasswordHash).toHaveBeenCalledWith('');
      expect(mockUserRepository.createUser).toHaveBeenCalledWith(
        command.createDto,
        mockHashedPassword,
      );
      expect(result).toBe(mockUser.id);
    });

    it('should handle special characters in username and email', async () => {
      // Arrange
      const specialDto = new CreateUserDto(
        'test_user.123',
        'Password123',
        'test+special@example.com',
      );
      const command = new CreateUserCommand(specialDto);
      (mockCryptoService.createPasswordHash as jest.Mock).mockResolvedValue(
        mockHashedPassword,
      );
      (mockUserRepository.createUser as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockCryptoService.createPasswordHash).toHaveBeenCalledWith(
        specialDto.password,
      );
      expect(mockUserRepository.createUser).toHaveBeenCalledWith(
        specialDto,
        mockHashedPassword,
      );
      expect(result).toBe(mockUser.id);
    });

    it('should handle unicode characters', async () => {
      // Arrange
      const unicodeDto = new CreateUserDto(
        'тестпользователь',
        'Password123',
        'тест@example.com',
      );
      const command = new CreateUserCommand(unicodeDto);
      (mockCryptoService.createPasswordHash as jest.Mock).mockResolvedValue(
        mockHashedPassword,
      );
      (mockUserRepository.createUser as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockCryptoService.createPasswordHash).toHaveBeenCalledWith(
        unicodeDto.password,
      );
      expect(mockUserRepository.createUser).toHaveBeenCalledWith(
        unicodeDto,
        mockHashedPassword,
      );
      expect(result).toBe(mockUser.id);
    });
  });
});
