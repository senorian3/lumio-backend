import { Test, TestingModule } from '@nestjs/testing';
import {
  UnfollowUserCommandHandler,
  UnfollowUserCommand,
} from '@lumio/modules/user-follows/application/commands/unfollow-user.command-handler';
import { UserFollowRepository } from '@lumio/modules/user-follows/domain/infrastructure/user-follow.repository';
import { FollowStatusViewDto } from '@lumio/modules/user-follows/api/dto/output/follow-status.view-dto';

describe('UnfollowUserCommandHandler', () => {
  let handler: UnfollowUserCommandHandler;
  let repository: jest.Mocked<UserFollowRepository>;

  beforeEach(async () => {
    const mockRepository = {
      getUser: jest.fn(),
      deleteFollowWithCounters: jest.fn(),
      getProfileCounters: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnfollowUserCommandHandler,
        {
          provide: UserFollowRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<UnfollowUserCommandHandler>(
      UnfollowUserCommandHandler,
    );
    repository = module.get(UserFollowRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should successfully unfollow a user', async () => {
      const followerId = 1;
      const followingId = 2;
      const command = new UnfollowUserCommand(followerId, followingId);

      const mockUser = {
        id: followingId,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        deletedAt: null,
        isBlocked: false,
        bannedAt: null,
        banReason: null,
      };
      const followerCounters = { followersCount: 10, followingCount: 5 };
      const followingCounters = { followersCount: 20, followingCount: 15 };

      repository.getUser.mockResolvedValue(mockUser);
      repository.deleteFollowWithCounters.mockResolvedValue(undefined);
      repository.getProfileCounters
        .mockResolvedValueOnce(followerCounters)
        .mockResolvedValueOnce(followingCounters);

      const result = await handler.execute(command);

      expect(result).toBeInstanceOf(FollowStatusViewDto);
      expect(result.isFollowing).toBe(false);
      expect(result.followersCount).toBe(followingCounters.followersCount);
      expect(result.followingCount).toBe(followerCounters.followingCount);

      expect(repository.getUser).toHaveBeenCalledWith(followingId);
      expect(repository.deleteFollowWithCounters).toHaveBeenCalledWith(
        followerId,
        followingId,
      );
      expect(repository.getProfileCounters).toHaveBeenCalledTimes(2);
      expect(repository.getProfileCounters).toHaveBeenCalledWith(followerId);
      expect(repository.getProfileCounters).toHaveBeenCalledWith(followingId);
    });

    it('should throw error when trying to unfollow non-existent user', async () => {
      const followerId = 1;
      const followingId = 999;
      const command = new UnfollowUserCommand(followerId, followingId);

      repository.getUser.mockRejectedValue(new Error('User not found'));

      await expect(handler.execute(command)).rejects.toThrow('User not found');
      expect(repository.getUser).toHaveBeenCalledWith(followingId);
      expect(repository.deleteFollowWithCounters).not.toHaveBeenCalled();
    });

    it('should throw error when trying to unfollow yourself', async () => {
      const userId = 1;
      const command = new UnfollowUserCommand(userId, userId);

      repository.getUser.mockResolvedValue({
        id: userId,
        username: 'self',
        email: 'self@example.com',
        password: 'hashed_password',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        deletedAt: null,
        isBlocked: false,
        bannedAt: null,
        banReason: null,
      });
      repository.deleteFollowWithCounters.mockRejectedValue(
        new Error('Cannot unfollow yourself'),
      );

      await expect(handler.execute(command)).rejects.toThrow(
        'Cannot unfollow yourself',
      );
      expect(repository.getUser).toHaveBeenCalledWith(userId);
      expect(repository.deleteFollowWithCounters).toHaveBeenCalledWith(
        userId,
        userId,
      );
    });

    it('should handle case when not following the user', async () => {
      const followerId = 1;
      const followingId = 2;
      const command = new UnfollowUserCommand(followerId, followingId);

      const mockUser = {
        id: followingId,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        deletedAt: null,
        isBlocked: false,
        bannedAt: null,
        banReason: null,
      };
      const followerCounters = { followersCount: 10, followingCount: 5 };
      const followingCounters = { followersCount: 20, followingCount: 15 };

      repository.getUser.mockResolvedValue(mockUser);
      repository.deleteFollowWithCounters.mockResolvedValue(undefined);
      repository.getProfileCounters
        .mockResolvedValueOnce(followerCounters)
        .mockResolvedValueOnce(followingCounters);

      const result = await handler.execute(command);

      expect(result).toBeInstanceOf(FollowStatusViewDto);
      expect(result.isFollowing).toBe(false);
    });
  });
});
