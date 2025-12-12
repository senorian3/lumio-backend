import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateUserUseCase,
  CreateUserCommand,
} from '@lumio/modules/user-accounts/users/application/use-cases/create-user.use-case';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { CryptoService } from '@lumio/modules/user-accounts/adapters/crypto.service';
import { CreateUserDto } from '@lumio/modules/user-accounts/users/api/dto/transfer/create-user.dto';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: UserRepository;
  let mockCryptoService: CryptoService;

  const mockCreateUserDto: CreateUserDto = {
    username: 'testuser',
    password: 'Password123',
    email: 'test@example.com',
  };

  const mockCreatedUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    emailConfirmation: {
      id: 1,
      userId: 1,
      isConfirmed: false,
      confirmationCode: 'code-123',
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create user and return user id', async () => {
      // Arrange
      const command = new CreateUserCommand(mockCreateUserDto);
      const hashedPassword = 'hashedPassword123';
      (mockCryptoService.createPasswordHash as jest.Mock).mockResolvedValue(
        hashedPassword,
      );
      (mockUserRepository.createUser as jest.Mock).mockResolvedValue(
        mockCreatedUser,
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockCryptoService.createPasswordHash).toHaveBeenCalledWith(
        mockCreateUserDto.password,
      );

      // Метод вызывается с двумя аргументами (подтверждено отладкой)
      expect(mockUserRepository.createUser).toHaveBeenCalledWith(
        mockCreateUserDto,
        hashedPassword,
      );

      expect(result).toBe(mockCreatedUser.id);
    });

    it('should hash password before creating user', async () => {
      // Arrange
      const command = new CreateUserCommand(mockCreateUserDto);
      const hashedPassword = 'hashedPassword123';
      (mockCryptoService.createPasswordHash as jest.Mock).mockResolvedValue(
        hashedPassword,
      );
      (mockUserRepository.createUser as jest.Mock).mockResolvedValue(
        mockCreatedUser,
      );

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockCryptoService.createPasswordHash).toHaveBeenCalledWith(
        'Password123',
      );

      expect(mockUserRepository.createUser).toHaveBeenCalledWith(
        mockCreateUserDto,
        hashedPassword,
      );
    });

    it('should handle crypto service errors', async () => {
      // Arrange
      const command = new CreateUserCommand(mockCreateUserDto);
      const error = new Error('Hash failed');
      (mockCryptoService.createPasswordHash as jest.Mock).mockRejectedValue(
        error,
      );

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow('Hash failed');
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      // Arrange
      const command = new CreateUserCommand(mockCreateUserDto);
      const hashedPassword = 'hashedPassword123';
      const error = new Error('Database error');
      (mockCryptoService.createPasswordHash as jest.Mock).mockResolvedValue(
        hashedPassword,
      );
      (mockUserRepository.createUser as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow('Database error');
      expect(mockCryptoService.createPasswordHash).toHaveBeenCalled();
    });
  });
});
