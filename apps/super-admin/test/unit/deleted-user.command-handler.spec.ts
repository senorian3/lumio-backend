import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLError } from 'graphql';
import {
  DeletedUserCommandHandler,
  DeletedUserCommand,
} from '@super-admin/modules/users/application/commands/deleted-user.command-handler';
import { UserRepository } from '@super-admin/modules/users/domain/infrastructure/user.repository';

describe('DeletedUserCommandHandler', () => {
  let handler: DeletedUserCommandHandler;

  const mockUserRepository = {
    findById: jest.fn(),
    softDeletedUserById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletedUserCommandHandler,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    handler = module.get<DeletedUserCommandHandler>(DeletedUserCommandHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should soft delete user successfully', async () => {
      const command = new DeletedUserCommand(1);
      const mockUser = { id: 1, username: 'testuser', deletedAt: null };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.softDeletedUserById.mockResolvedValue(undefined);

      const result = await handler.execute(command);

      expect(result).toBe(true);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(mockUserRepository.softDeletedUserById).toHaveBeenCalledWith(1);
    });

    it('should throw GraphQLError when user not found', async () => {
      const command = new DeletedUserCommand(999);

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(GraphQLError);
      await expect(handler.execute(command)).rejects.toThrow('User not found');
    });

    it('should throw GraphQLError with Not found extension code', async () => {
      const command = new DeletedUserCommand(999);

      mockUserRepository.findById.mockResolvedValue(null);

      try {
        await handler.execute(command);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe('Not found');
      }
    });

    it('should call softDeletedUserById with correct userId', async () => {
      const command = new DeletedUserCommand(42);
      const mockUser = { id: 42, username: 'testuser', deletedAt: null };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.softDeletedUserById.mockResolvedValue(undefined);

      await handler.execute(command);

      expect(mockUserRepository.softDeletedUserById).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.softDeletedUserById).toHaveBeenCalledWith(42);
    });
  });
});
