import { Test, TestingModule } from '@nestjs/testing';
import {
  GetFollowersQueryHandler,
  GetFollowersQuery,
} from '@lumio/modules/user-follows/application/queries/get-followers.query-handler';
import { UserFollowQueryRepository } from '@lumio/modules/user-follows/domain/infrastructure/user-follow.query-repository';
import { PaginatedFollowersViewDto } from '@lumio/modules/user-follows/api/dto/output/followers.paginated.view-dto';
import { GetFollowersInputDto } from '@lumio/modules/user-follows/api/dto/input/get-followers.input-dto';

describe('GetFollowersQueryHandler', () => {
  let handler: GetFollowersQueryHandler;
  let queryRepository: jest.Mocked<UserFollowQueryRepository>;

  beforeEach(async () => {
    const mockQueryRepository = {
      getFollowers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetFollowersQueryHandler,
        {
          provide: UserFollowQueryRepository,
          useValue: mockQueryRepository,
        },
      ],
    }).compile();

    handler = module.get<GetFollowersQueryHandler>(GetFollowersQueryHandler);
    queryRepository = module.get(UserFollowQueryRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return paginated followers', async () => {
      const currentUserId = 1;
      const targetUserId = 2;
      const queryDto = new GetFollowersInputDto();
      queryDto.pageNumber = 1;
      queryDto.pageSize = 10;
      queryDto.userId = targetUserId;

      const query = new GetFollowersQuery(
        currentUserId,
        targetUserId,
        queryDto,
      );

      const mockPaginatedResult = new PaginatedFollowersViewDto();
      mockPaginatedResult.items = [
        {
          id: 3,
          username: 'follower1',
          avatarUrl: null,
          followedAt: new Date('2024-01-15T10:30:00.000Z'),
        },
        {
          id: 4,
          username: 'follower2',
          avatarUrl: 'https://example.com/avatar.jpg',
          followedAt: new Date('2024-01-16T11:30:00.000Z'),
        },
      ];
      mockPaginatedResult.totalCount = 2;
      mockPaginatedResult.page = 1;
      mockPaginatedResult.pageSize = 10;

      queryRepository.getFollowers.mockResolvedValue(mockPaginatedResult);

      const result = await handler.execute(query);

      expect(result).toEqual(mockPaginatedResult);
      expect(queryRepository.getFollowers).toHaveBeenCalledWith(
        targetUserId,
        queryDto.pageNumber,
        queryDto.pageSize,
      );
    });

    it('should handle empty followers list', async () => {
      const currentUserId = 1;
      const targetUserId = 2;
      const queryDto = new GetFollowersInputDto();
      queryDto.pageNumber = 1;
      queryDto.pageSize = 10;
      queryDto.userId = targetUserId;

      const query = new GetFollowersQuery(
        currentUserId,
        targetUserId,
        queryDto,
      );

      const mockPaginatedResult = new PaginatedFollowersViewDto();
      mockPaginatedResult.items = [];
      mockPaginatedResult.totalCount = 0;
      mockPaginatedResult.page = 1;
      mockPaginatedResult.pageSize = 10;

      queryRepository.getFollowers.mockResolvedValue(mockPaginatedResult);

      const result = await handler.execute(query);

      expect(result).toEqual(mockPaginatedResult);
      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      const currentUserId = 1;
      const targetUserId = 2;
      const queryDto = new GetFollowersInputDto();
      queryDto.pageNumber = 2;
      queryDto.pageSize = 5;
      queryDto.userId = targetUserId;

      const query = new GetFollowersQuery(
        currentUserId,
        targetUserId,
        queryDto,
      );

      const mockPaginatedResult = new PaginatedFollowersViewDto();
      mockPaginatedResult.items = [
        {
          id: 6,
          username: 'follower6',
          avatarUrl: null,
          followedAt: new Date('2024-01-20T12:30:00.000Z'),
        },
      ];
      mockPaginatedResult.totalCount = 6;
      mockPaginatedResult.page = 2;
      mockPaginatedResult.pageSize = 5;

      queryRepository.getFollowers.mockResolvedValue(mockPaginatedResult);

      const result = await handler.execute(query);

      expect(result).toEqual(mockPaginatedResult);
      expect(queryRepository.getFollowers).toHaveBeenCalledWith(
        targetUserId,
        queryDto.pageNumber,
        queryDto.pageSize,
      );
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(5);
    });
  });
});
