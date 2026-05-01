import { Test, TestingModule } from '@nestjs/testing';
import { UserFollowsController } from '@lumio/modules/user-follows/api/user-follows.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UserFollowQueryDto } from '@lumio/modules/user-follows/api/dto/input/user-follow-query.input-dto';
import { PaginatedFollowersViewDto } from '@lumio/modules/user-follows/api/dto/output/followers.paginated.view-dto';
import { PaginatedFollowingViewDto } from '@lumio/modules/user-follows/api/dto/output/following.paginated.view-dto';
import { GetFollowersQuery } from '@lumio/modules/user-follows/application/queries/get-followers.query-handler';
import { GetFollowingQuery } from '@lumio/modules/user-follows/application/queries/get-following.query-handler';

describe('UserFollowsController', () => {
  let controller: UserFollowsController;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    const mockCommandBus = {
      execute: jest.fn(),
    };

    const mockQueryBus = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserFollowsController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserFollowsController>(UserFollowsController);
    queryBus = module.get(QueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFollowers', () => {
    it('should return paginated followers for current user', async () => {
      const currentUserId = 1;
      const queryDto = new UserFollowQueryDto();
      queryDto.pageNumber = 1;
      queryDto.pageSize = 10;

      const mockResult = new PaginatedFollowersViewDto();
      mockResult.items = [
        {
          id: 2,
          username: 'follower1',
          avatarUrl: null,
          followedAt: new Date('2024-01-15T10:30:00.000Z'),
        },
      ];
      mockResult.totalCount = 1;
      mockResult.page = 1;
      mockResult.pageSize = 10;

      queryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getFollowers(currentUserId, queryDto);

      expect(result).toEqual(mockResult);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetFollowersQuery),
      );

      const query = queryBus.execute.mock.calls[0][0] as GetFollowersQuery;
      expect(query.currentUserId).toBe(currentUserId);
      expect(query.targetUserId).toBe(currentUserId);
      expect(query.query).toBe(queryDto);
    });

    it('should return paginated followers for specific user', async () => {
      const currentUserId = 1;
      const targetUserId = 2;
      const queryDto = new UserFollowQueryDto();
      queryDto.pageNumber = 1;
      queryDto.pageSize = 10;
      queryDto.userId = targetUserId;

      const mockResult = new PaginatedFollowersViewDto();
      mockResult.items = [
        {
          id: 3,
          username: 'follower2',
          avatarUrl: 'https://example.com/avatar.jpg',
          followedAt: new Date('2024-01-16T11:30:00.000Z'),
        },
      ];
      mockResult.totalCount = 1;
      mockResult.page = 1;
      mockResult.pageSize = 10;

      queryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getFollowers(currentUserId, queryDto);

      expect(result).toEqual(mockResult);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetFollowersQuery),
      );

      const query = queryBus.execute.mock.calls[0][0] as GetFollowersQuery;
      expect(query.currentUserId).toBe(currentUserId);
      expect(query.targetUserId).toBe(targetUserId);
      expect(query.query).toBe(queryDto);
    });
  });

  describe('getFollowing', () => {
    it('should return paginated following for current user', async () => {
      const currentUserId = 1;
      const queryDto = new UserFollowQueryDto();
      queryDto.pageNumber = 1;
      queryDto.pageSize = 10;

      const mockResult = new PaginatedFollowingViewDto();
      mockResult.items = [
        {
          id: 2,
          username: 'following1',
          avatarUrl: null,
          followedAt: new Date('2024-01-15T10:30:00.000Z'),
        },
      ];
      mockResult.totalCount = 1;
      mockResult.page = 1;
      mockResult.pageSize = 10;

      queryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getFollowing(currentUserId, queryDto);

      expect(result).toEqual(mockResult);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetFollowingQuery),
      );

      const query = queryBus.execute.mock.calls[0][0] as GetFollowingQuery;
      expect(query.currentUserId).toBe(currentUserId);
      expect(query.targetUserId).toBe(currentUserId);
      expect(query.query).toBe(queryDto);
    });

    it('should return paginated following for specific user', async () => {
      const currentUserId = 1;
      const targetUserId = 2;
      const queryDto = new UserFollowQueryDto();
      queryDto.pageNumber = 1;
      queryDto.pageSize = 10;
      queryDto.userId = targetUserId;

      const mockResult = new PaginatedFollowingViewDto();
      mockResult.items = [
        {
          id: 3,
          username: 'following2',
          avatarUrl: 'https://example.com/avatar.jpg',
          followedAt: new Date('2024-01-16T11:30:00.000Z'),
        },
      ];
      mockResult.totalCount = 1;
      mockResult.page = 1;
      mockResult.pageSize = 10;

      queryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getFollowing(currentUserId, queryDto);

      expect(result).toEqual(mockResult);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetFollowingQuery),
      );

      const query = queryBus.execute.mock.calls[0][0] as GetFollowingQuery;
      expect(query.currentUserId).toBe(currentUserId);
      expect(query.targetUserId).toBe(targetUserId);
      expect(query.query).toBe(queryDto);
    });
  });

  describe('getUserFollowers', () => {
    it('should return paginated followers for specific user via path parameter', async () => {
      const currentUserId = 1;
      const targetUserId = 2;
      const queryDto = new UserFollowQueryDto();
      queryDto.pageNumber = 1;
      queryDto.pageSize = 10;

      const mockResult = new PaginatedFollowersViewDto();
      mockResult.items = [
        {
          id: 3,
          username: 'follower1',
          avatarUrl: null,
          followedAt: new Date('2024-01-15T10:30:00.000Z'),
        },
      ];
      mockResult.totalCount = 1;
      mockResult.page = 1;
      mockResult.pageSize = 10;

      queryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getUserFollowers(
        currentUserId,
        targetUserId,
        queryDto,
      );

      expect(result).toEqual(mockResult);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetFollowersQuery),
      );

      const query = queryBus.execute.mock.calls[0][0] as GetFollowersQuery;
      expect(query.currentUserId).toBe(currentUserId);
      expect(query.targetUserId).toBe(targetUserId);
      expect(query.query).toBe(queryDto);
    });
  });

  describe('getUserFollowing', () => {
    it('should return paginated following for specific user via path parameter', async () => {
      const currentUserId = 1;
      const targetUserId = 2;
      const queryDto = new UserFollowQueryDto();
      queryDto.pageNumber = 1;
      queryDto.pageSize = 10;

      const mockResult = new PaginatedFollowingViewDto();
      mockResult.items = [
        {
          id: 3,
          username: 'following1',
          avatarUrl: null,
          followedAt: new Date('2024-01-15T10:30:00.000Z'),
        },
      ];
      mockResult.totalCount = 1;
      mockResult.page = 1;
      mockResult.pageSize = 10;

      queryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getUserFollowing(
        currentUserId,
        targetUserId,
        queryDto,
      );

      expect(result).toEqual(mockResult);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetFollowingQuery),
      );

      const query = queryBus.execute.mock.calls[0][0] as GetFollowingQuery;
      expect(query.currentUserId).toBe(currentUserId);
      expect(query.targetUserId).toBe(targetUserId);
      expect(query.query).toBe(queryDto);
    });
  });
});
