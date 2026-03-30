import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLError } from 'graphql';
import {
  BanUserCommandHandler,
  BanUserCommand,
} from '@super-admin/modules/users/application/commands/ban-user.command-handler';
import { UserRepository } from '@super-admin/modules/users/domain/infrastructure/user.repository';

describe('BanUserCommandHandler', () => {
  let handler: BanUserCommandHandler;

  const mockUserRepository = {
    findById: jest.fn(),
    updateBanStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BanUserCommandHandler,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    handler = module.get<BanUserCommandHandler>(BanUserCommandHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should ban user successfully', async () => {
      const command = new BanUserCommand(1, 'Violation of terms');
      const mockUser = { id: 1, username: 'testuser', isBlocked: false };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.updateBanStatus.mockResolvedValue(undefined);

      const result = await handler.execute(command);

      expect(result).toBe(true);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(mockUserRepository.updateBanStatus).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          isBlocked: true,
          banReason: 'Violation of terms',
        }),
      );
    });

    it('should throw GraphQLError when user not found', async () => {
      const command = new BanUserCommand(999, 'Violation of terms');

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(GraphQLError);
      await expect(handler.execute(command)).rejects.toThrow('User not found');
    });

    it('should throw GraphQLError with Not found extension code', async () => {
      const command = new BanUserCommand(999, 'Violation of terms');

      mockUserRepository.findById.mockResolvedValue(null);

      try {
        await handler.execute(command);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe('Not found');
      }
    });

    it('should set bannedAt to current date', async () => {
      const command = new BanUserCommand(1, 'Violation of terms');
      const mockUser = { id: 1, username: 'testuser', isBlocked: false };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.updateBanStatus.mockResolvedValue(undefined);

      await handler.execute(command);

      const updateCall = mockUserRepository.updateBanStatus.mock.calls[0];
      const banDto = updateCall[1];

      expect(banDto.bannedAt).toBeInstanceOf(Date);
      expect(banDto.isBlocked).toBe(true);
      expect(banDto.banReason).toBe('Violation of terms');
    });
  });
});
