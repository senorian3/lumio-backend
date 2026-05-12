import { Test, TestingModule } from '@nestjs/testing';
import {
  FollowUserCommandHandler,
  FollowUserCommand,
} from '@lumio/modules/user-follows/application/commands/follow-user.command-handler';
import { UserFollowRepository } from '@lumio/modules/user-follows/domain/infrastructure/user-follow.repository';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { FollowStatusViewDto } from '@lumio/modules/user-follows/api/dto/output/follow-status.view-dto';

describe('FollowUserCommandHandler', () => {
  let handler: FollowUserCommandHandler;
  let userFollowRepository: jest.Mocked<UserFollowRepository>;
  let externalQueryRepository: jest.Mocked<ExternalQueryUserAccountsRepository>;

  beforeEach(async () => {
    const mockUserFollowRepository = {
      isAlreadyFollowing: jest.fn(),
      createFollowWithCounters: jest.fn(),
    };

    const mockExternalQueryRepository = {
      getProfileByUserId: jest.fn(),
      getUserInfo: jest.fn(),
      getProfileCounters: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowUserCommandHandler,
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

    handler = module.get<FollowUserCommandHandler>(FollowUserCommandHandler);
    userFollowRepository = module.get(UserFollowRepository);
    externalQueryRepository = module.get(ExternalQueryUserAccountsRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should successfully follow a user', async () => {
      const followerId = 1;
      const followingId = 2;
      const command = new FollowUserCommand(followerId, followingId);

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

      userFollowRepository.isAlreadyFollowing.mockResolvedValue(null);
      externalQueryRepository.getProfileByUserId.mockResolvedValue(
        mockProfile as any,
      );
      externalQueryRepository.getUserInfo.mockResolvedValue(mockUser);
      userFollowRepository.createFollowWithCounters.mockResolvedValue(
        undefined,
      );
      externalQueryRepository.getProfileCounters
        .mockResolvedValueOnce(followerCounters)
        .mockResolvedValueOnce(followingCounters);

      const result = await handler.execute(command);

      expect(result).toBeInstanceOf(FollowStatusViewDto);
      expect(result.isFollowing).toBe(true);
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
        userFollowRepository.createFollowWithCounters,
      ).toHaveBeenCalledWith(followerId, followingId);
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

    it('should throw error when trying to follow non-existent user', async () => {
      const followerId = 1;
      const followingId = 999;
      const command = new FollowUserCommand(followerId, followingId);

      const mockProfile = {
        profileFilled: true,
        userId: followerId,
      };

      userFollowRepository.isAlreadyFollowing.mockResolvedValue(null);
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
        userFollowRepository.createFollowWithCounters,
      ).not.toHaveBeenCalled();
    });

    it('should throw error when trying to follow yourself', async () => {
      const userId = 1;
      const command = new FollowUserCommand(userId, userId);

      await expect(handler.execute(command)).rejects.toThrow('Bad Request');
      expect(userFollowRepository.isAlreadyFollowing).not.toHaveBeenCalled();
      expect(externalQueryRepository.getProfileByUserId).not.toHaveBeenCalled();
      expect(externalQueryRepository.getUserInfo).not.toHaveBeenCalled();
      expect(
        userFollowRepository.createFollowWithCounters,
      ).not.toHaveBeenCalled();
    });

    it('should throw error when profile is not filled', async () => {
      const followerId = 1;
      const followingId = 2;
      const command = new FollowUserCommand(followerId, followingId);

      const mockProfile = {
        profileFilled: false,
        userId: followerId,
      };

      userFollowRepository.isAlreadyFollowing.mockResolvedValue(null);
      externalQueryRepository.getProfileByUserId.mockResolvedValue(
        mockProfile as any,
      );

      await expect(handler.execute(command)).rejects.toThrow('Forbidden');
      expect(externalQueryRepository.getProfileByUserId).toHaveBeenCalledWith(
        followerId,
      );
      expect(externalQueryRepository.getUserInfo).not.toHaveBeenCalled();
      expect(
        userFollowRepository.createFollowWithCounters,
      ).not.toHaveBeenCalled();
    });

    it('should throw error when already following', async () => {
      const followerId = 1;
      const followingId = 2;
      const command = new FollowUserCommand(followerId, followingId);

      userFollowRepository.isAlreadyFollowing.mockResolvedValue({
        id: 1,
        followerId: 1,
        followingId: 2,
        createdAt: new Date(),
        deletedAt: null,
      });

      await expect(handler.execute(command)).rejects.toThrow('Bad Request');
      expect(userFollowRepository.isAlreadyFollowing).toHaveBeenCalledWith(
        followerId,
        followingId,
      );
      expect(externalQueryRepository.getProfileByUserId).not.toHaveBeenCalled();
      expect(
        userFollowRepository.createFollowWithCounters,
      ).not.toHaveBeenCalled();
    });
  });
});
