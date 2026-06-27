import { Test, TestingModule } from '@nestjs/testing';
import {
  GetFeedQueryHandler,
  GetFeedQuery,
} from '@lumio/modules/user-follows/application/queries/get-feed.query-handler';
import { UserFollowQueryRepository } from '@lumio/modules/user-follows/domain/infrastructure/user-follow.query-repository';
import { ExternalQueryPostsRepository } from '@lumio/modules/posts/domain/infrastructure/post.external-query.repository';
import { GetFeedInputDto } from '@lumio/modules/user-follows/api/dto/input/get-feed.input-dto';

describe('GetFeedQueryHandler', () => {
  let handler: GetFeedQueryHandler;
  let userFollowQueryRepository: jest.Mocked<UserFollowQueryRepository>;
  let externalQueryPostsRepository: jest.Mocked<ExternalQueryPostsRepository>;

  beforeEach(async () => {
    const mockUserFollowQueryRepository = {
      getFollowingIds: jest.fn(),
    };

    const mockExternalQueryPostsRepository = {
      getPostsByUserIds: jest.fn(),
      getUsersReactionsForPosts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetFeedQueryHandler,
        {
          provide: UserFollowQueryRepository,
          useValue: mockUserFollowQueryRepository,
        },
        {
          provide: ExternalQueryPostsRepository,
          useValue: mockExternalQueryPostsRepository,
        },
      ],
    }).compile();

    handler = module.get<GetFeedQueryHandler>(GetFeedQueryHandler);
    userFollowQueryRepository = module.get(UserFollowQueryRepository);
    externalQueryPostsRepository = module.get(ExternalQueryPostsRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return feed with posts from followed users', async () => {
      const currentUserId = 1;
      const feedQuery = new GetFeedInputDto();
      feedQuery.pageNumber = 1;
      feedQuery.pageSize = 10;

      const query = new GetFeedQuery(currentUserId, feedQuery);

      const followingIds = [2, 3, 4];
      const mockPosts = [
        {
          id: 1,
          userId: 2,
          content: 'Post 1',
          createdAt: new Date('2024-01-15T10:00:00.000Z'),
          files: [],
        },
        {
          id: 2,
          userId: 3,
          content: 'Post 2',
          createdAt: new Date('2024-01-16T11:00:00.000Z'),
          files: [],
        },
      ];

      userFollowQueryRepository.getFollowingIds.mockResolvedValue(followingIds);
      externalQueryPostsRepository.getPostsByUserIds.mockResolvedValue({
        posts: mockPosts,
        totalCount: 2,
      });
      externalQueryPostsRepository.getUsersReactionsForPosts.mockResolvedValue(
        new Map(),
      );

      const result = await handler.execute(query);

      expect(result).toBeInstanceOf(Object);
      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.pagesCount).toBe(1);

      expect(userFollowQueryRepository.getFollowingIds).toHaveBeenCalledWith(
        currentUserId,
      );
      expect(
        externalQueryPostsRepository.getPostsByUserIds,
      ).toHaveBeenCalledWith(followingIds, 0, 10);
    });

    it('should return empty feed when not following anyone', async () => {
      const currentUserId = 1;
      const feedQuery = new GetFeedInputDto();
      feedQuery.pageNumber = 1;
      feedQuery.pageSize = 10;

      const query = new GetFeedQuery(currentUserId, feedQuery);

      userFollowQueryRepository.getFollowingIds.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);

      expect(userFollowQueryRepository.getFollowingIds).toHaveBeenCalledWith(
        currentUserId,
      );
      expect(
        externalQueryPostsRepository.getPostsByUserIds,
      ).not.toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      const currentUserId = 1;
      const feedQuery = new GetFeedInputDto();
      feedQuery.pageNumber = 2;
      feedQuery.pageSize = 5;

      const query = new GetFeedQuery(currentUserId, feedQuery);

      const followingIds = [2, 3];
      const mockPosts = [
        {
          id: 6,
          userId: 2,
          content: 'Post 6',
          createdAt: new Date('2024-01-20T12:00:00.000Z'),
          files: [],
        },
      ];

      userFollowQueryRepository.getFollowingIds.mockResolvedValue(followingIds);
      externalQueryPostsRepository.getPostsByUserIds.mockResolvedValue({
        posts: mockPosts,
        totalCount: 6,
      });
      externalQueryPostsRepository.getUsersReactionsForPosts.mockResolvedValue(
        new Map(),
      );

      const result = await handler.execute(query);

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(6);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(5);
      expect(result.pagesCount).toBe(2);

      expect(
        externalQueryPostsRepository.getPostsByUserIds,
      ).toHaveBeenCalledWith(followingIds, 5, 5);
    });
  });
});
