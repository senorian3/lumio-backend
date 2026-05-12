import { Test, TestingModule } from '@nestjs/testing';
import {
  SearchUsersQueryHandler,
  SearchUsersQuery,
} from '@lumio/modules/user-follows/application/queries/search-users.query-handler';
import { UserFollowQueryRepository } from '@lumio/modules/user-follows/domain/infrastructure/user-follow.query-repository';
import { SearchUsersInputDto } from '@lumio/modules/user-follows/api/dto/input/search-users.input-dto';

describe('SearchUsersQueryHandler', () => {
  let handler: SearchUsersQueryHandler;
  let userFollowQueryRepository: jest.Mocked<UserFollowQueryRepository>;

  beforeEach(async () => {
    const mockUserFollowQueryRepository = {
      getFollowingIds: jest.fn(),
      searchUsers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchUsersQueryHandler,
        {
          provide: UserFollowQueryRepository,
          useValue: mockUserFollowQueryRepository,
        },
      ],
    }).compile();

    handler = module.get<SearchUsersQueryHandler>(SearchUsersQueryHandler);
    userFollowQueryRepository = module.get(UserFollowQueryRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should search users and return paginated results', async () => {
      const currentUserId = 1;
      const searchQuery = new SearchUsersInputDto();
      searchQuery.username = 'john';
      searchQuery.pageNumber = 1;
      searchQuery.pageSize = 10;

      const query = new SearchUsersQuery(currentUserId, searchQuery);

      const followingIds = [2, 3];
      const mockSearchResult = {
        items: [
          {
            id: 2,
            username: 'john_doe',
            avatarUrl: 'https://example.com/avatar.jpg',
            aboutMe: 'Software developer',
            followersCount: 10,
            followingCount: 5,
            postsCount: 15,
            isFollowing: true,
          },
          {
            id: 4,
            username: 'john_smith',
            avatarUrl: null,
            aboutMe: null,
            followersCount: 3,
            followingCount: 1,
            postsCount: 0,
            isFollowing: false,
          },
        ],
        totalCount: 2,
        pagesCount: 1,
        page: 1,
        pageSize: 10,
      };

      userFollowQueryRepository.getFollowingIds.mockResolvedValue(followingIds);
      userFollowQueryRepository.searchUsers.mockResolvedValue(
        mockSearchResult as any,
      );

      const result = await handler.execute(query);

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);

      expect(userFollowQueryRepository.getFollowingIds).toHaveBeenCalledWith(
        currentUserId,
      );
      expect(userFollowQueryRepository.searchUsers).toHaveBeenCalledWith(
        currentUserId,
        searchQuery,
        followingIds,
      );
    });

    it('should search users when not following anyone', async () => {
      const currentUserId = 1;
      const searchQuery = new SearchUsersInputDto();
      searchQuery.username = 'alice';
      searchQuery.pageNumber = 1;
      searchQuery.pageSize = 10;

      const query = new SearchUsersQuery(currentUserId, searchQuery);

      const followingIds: number[] = [];
      const mockSearchResult = {
        items: [
          {
            id: 5,
            username: 'alice_wonder',
            avatarUrl: null,
            aboutMe: 'Designer',
            followersCount: 50,
            followingCount: 20,
            postsCount: 30,
            isFollowing: false,
          },
        ],
        totalCount: 1,
        pagesCount: 1,
        page: 1,
        pageSize: 10,
      };

      userFollowQueryRepository.getFollowingIds.mockResolvedValue(followingIds);
      userFollowQueryRepository.searchUsers.mockResolvedValue(
        mockSearchResult as any,
      );

      const result = await handler.execute(query);

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.items[0].isFollowing).toBe(false);

      expect(userFollowQueryRepository.searchUsers).toHaveBeenCalledWith(
        currentUserId,
        searchQuery,
        [],
      );
    });

    it('should return empty results when no users match', async () => {
      const currentUserId = 1;
      const searchQuery = new SearchUsersInputDto();
      searchQuery.username = 'nonexistent';
      searchQuery.pageNumber = 1;
      searchQuery.pageSize = 10;

      const query = new SearchUsersQuery(currentUserId, searchQuery);

      const followingIds: number[] = [];
      const mockSearchResult = {
        items: [],
        totalCount: 0,
        pagesCount: 0,
        page: 1,
        pageSize: 10,
      };

      userFollowQueryRepository.getFollowingIds.mockResolvedValue(followingIds);
      userFollowQueryRepository.searchUsers.mockResolvedValue(
        mockSearchResult as any,
      );

      const result = await handler.execute(query);

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });
});
