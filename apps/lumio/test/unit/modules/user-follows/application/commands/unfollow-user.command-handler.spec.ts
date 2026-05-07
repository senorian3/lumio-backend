import { Test, TestingModule } from '@nestjs/testing';
import {
  UnfollowUserCommandHandler,
  UnfollowUserCommand,
} from '@lumio/modules/user-follows/application/commands/unfollow-user.command-handler';
import { UserFollowRepository } from '@lumio/modules/user-follows/domain/infrastructure/user-follow.repository';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { FollowStatusViewDto } from '@lumio/modules/user-follows/api/dto/output/follow-status.view-dto';

describe('UnfollowUserCommandHandler', () => {
  let handler: UnfollowUserCommandHandler;
  let userFollowRepository: jest.Mocked<UserFollowRepository>;
  let externalQueryRepository: jest.Mocked<ExternalQueryUserAccountsRepository>;

  beforeEach(async () => {
    const mockUserFollowRepository = {
      isAlreadyFollowing: jest.fn(),
      deleteFollowWithCounters: jest.fn(),
    };

    const mockExternalQueryRepository = {
      getProfileByUserId: jest.fn(),
      getUserInfo: jest.fn(),
      getProfileCounters: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnfollowUserCommandHandler,
        {
          provide: UserFollowRepository,
          useValue: mockUserFollowRepository,
        },
        {
          provide: ExternalQueryUserAccountsRepository,
          useValue: mockExternalQueryRepository,
        },
      ],
    }).compile();

    handler = module.get<UnfollowUserCommandHandler>(
      UnfollowUserCommandHandler,
    );
    userFollowRepository = module.get(UserFollowRepository);
    externalQueryRepository = module.get(ExternalQueryUserAccountsRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should successfully unfollow a user', async () => {
      const followerId = 1;
      const followingId = 2;
      const command = new UnfollowUserCommand(followerId, followingId);

      const mockProfile = {
        profileFilled: true,
        userId: followerId,
      };
      const mockUser = {
        id: followingId,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        isBlocked: false,
      };
      const followerCounters = { followersCount: 10, followingCount: 5 };
      const followingCounters = { followersCount: 20, followingCount: 15 };

      userFollowRepository.isAlreadyFollowing.mockResolvedValue({
        id: 1,
        followerId,
        followingId,
        createdAt: new Date(),
        deletedAt: null,
      });
      externalQueryRepository.getProfileByUserId.mockResolvedValue(
        mockProfile as any,
      );
      externalQueryRepository.getUserInfo.mockResolvedValue(mockUser);
      userFollowRepository.deleteFollowWithCounters.mockResolvedValue(
        undefined,
      );
      externalQueryRepository.getProfileCounters
        .mockResolvedValueOnce(followerCounters)
        .mockResolvedValueOnce(followingCounters);

      const result = await handler.execute(command);

      expect(result).toBeInstanceOf(FollowStatusViewDto);
      expect(result.isFollowing).toBe(false);
      expect(result.followersCount).toBe(followingCounters.followersCount);
      expect(result.followingCount).toBe(followerCounters.followingCount);

      expect(userFollowRepository.isAlreadyFollowing).toHaveBeenCalledWith(
        followerId,
        followingId,
      );
      expect(externalQueryRepository.getProfileByUserId).toHaveBeenCalledWith(
        followerId,
      );
      expect(externalQueryRepository.getUserInfo).toHaveBeenCalledWith(
        followingId,
      );
      expect(
        userFollowRepository.deleteFollowWithCounters,
      ).toHaveBeenCalledWith(followerId, followingId, 1);
      expect(externalQueryRepository.getProfileCounters).toHaveBeenCalledTimes(
        2,
      );
      expect(externalQueryRepository.getProfileCounters).toHaveBeenCalledWith(
        followerId,
      );
      expect(externalQueryRepository.getProfileCounters).toHaveBeenCalledWith(
        followingId,
      );
    });

    it('should throw error when trying to unfollow non-existent user', async () => {
      const followerId = 1;
      const followingId = 999;
      const command = new UnfollowUserCommand(followerId, followingId);

      const mockProfile = {
        profileFilled: true,
        userId: followerId,
      };

      userFollowRepository.isAlreadyFollowing.mockResolvedValue({
        id: 1,
        followerId,
        followingId,
        createdAt: new Date(),
        deletedAt: null,
      });
      externalQueryRepository.getProfileByUserId.mockResolvedValue(
        mockProfile as any,
      );
      externalQueryRepository.getUserInfo.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow('Not Found');
      expect(externalQueryRepository.getProfileByUserId).toHaveBeenCalledWith(
        followerId,
      );
      expect(externalQueryRepository.getUserInfo).toHaveBeenCalledWith(
        followingId,
      );
      expect(
        userFollowRepository.deleteFollowWithCounters,
      ).not.toHaveBeenCalled();
    });

    it('should throw error when trying to unfollow yourself', async () => {
      const userId = 1;
      const command = new UnfollowUserCommand(userId, userId);

      await expect(handler.execute(command)).rejects.toThrow('Bad Request');
      expect(userFollowRepository.isAlreadyFollowing).not.toHaveBeenCalled();
      expect(externalQueryRepository.getProfileByUserId).not.toHaveBeenCalled();
      expect(externalQueryRepository.getUserInfo).not.toHaveBeenCalled();
      expect(
        userFollowRepository.deleteFollowWithCounters,
      ).not.toHaveBeenCalled();
    });

    it('should throw error when profile is not filled', async () => {
      const followerId = 1;
      const followingId = 2;
      const command = new UnfollowUserCommand(followerId, followingId);

      const mockProfile = {
        profileFilled: false,
        userId: followerId,
      };

      userFollowRepository.isAlreadyFollowing.mockResolvedValue({
        id: 1,
        followerId,
        followingId,
        createdAt: new Date(),
        deletedAt: null,
      });
      externalQueryRepository.getProfileByUserId.mockResolvedValue(
        mockProfile as any,
      );

      await expect(handler.execute(command)).rejects.toThrow('Forbidden');
      expect(externalQueryRepository.getProfileByUserId).toHaveBeenCalledWith(
        followerId,
      );
      expect(externalQueryRepository.getUserInfo).not.toHaveBeenCalled();
      expect(
        userFollowRepository.deleteFollowWithCounters,
      ).not.toHaveBeenCalled();
    });

    it('should throw error when not following the user', async () => {
      const followerId = 1;
      const followingId = 2;
      const command = new UnfollowUserCommand(followerId, followingId);

      userFollowRepository.isAlreadyFollowing.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow('Bad Request');
      expect(userFollowRepository.isAlreadyFollowing).toHaveBeenCalledWith(
        followerId,
        followingId,
      );
      expect(externalQueryRepository.getProfileByUserId).not.toHaveBeenCalled();
      expect(
        userFollowRepository.deleteFollowWithCounters,
      ).not.toHaveBeenCalled();
    });
  });
});
