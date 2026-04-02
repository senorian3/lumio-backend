import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLError } from 'graphql';
import {
  UnBanUserCommandHandler,
  UnBanUserCommand,
} from '@super-admin/modules/users/application/commands/unban-user.command-handler';
import { UserRepository } from '@super-admin/modules/users/domain/infrastructure/user.repository';

describe('UnBanUserCommandHandler', () => {
  let handler: UnBanUserCommandHandler;

  const mockUserRepository = {
    findById: jest.fn(),
    updateBanStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnBanUserCommandHandler,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    handler = module.get<UnBanUserCommandHandler>(UnBanUserCommandHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should unban user successfully', async () => {
      const command = new UnBanUserCommand(1);
      const mockUser = { id: 1, username: 'testuser', isBlocked: true };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.updateBanStatus.mockResolvedValue(undefined);

      const result = await handler.execute(command);

      expect(result).toBe(true);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(mockUserRepository.updateBanStatus).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          isBlocked: false,
          bannedAt: null,
          banReason: null,
        }),
      );
    });

    it('should throw GraphQLError when user not found', async () => {
      const command = new UnBanUserCommand(999);

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(GraphQLError);
      await expect(handler.execute(command)).rejects.toThrow('User not found');
    });

    it('should throw GraphQLError with Not found extension code', async () => {
      const command = new UnBanUserCommand(999);

      mockUserRepository.findById.mockResolvedValue(null);

      try {
        await handler.execute(command);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe('Not found');
      }
    });
  });
});
