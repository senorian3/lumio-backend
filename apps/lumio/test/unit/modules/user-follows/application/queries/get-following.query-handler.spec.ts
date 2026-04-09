import { Test, TestingModule } from '@nestjs/testing';
import {
  GetFollowingQueryHandler,
  GetFollowingQuery,
} from '@lumio/modules/user-follows/application/queries/get-following.query-handler';
import { UserFollowQueryRepository } from '@lumio/modules/user-follows/domain/infrastructure/user-follow.query-repository';
import { PaginatedFollowingViewDto } from '@lumio/modules/user-follows/api/dto/output/following.paginated.view-dto';
import { GetFollowingInputDto } from '@lumio/modules/user-follows/api/dto/input/get-following.input-dto';

describe('GetFollowingQueryHandler', () => {
  let handler: GetFollowingQueryHandler;
  let queryRepository: jest.Mocked<UserFollowQueryRepository>;

  beforeEach(async () => {
    const mockQueryRepository = {
      getFollowing: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetFollowingQueryHandler,
        {
          provide: UserFollowQueryRepository,
          useValue: mockQueryRepository,
        },
      ],
    }).compile();

    handler = module.get<GetFollowingQueryHandler>(GetFollowingQueryHandler);
    queryRepository = module.get(UserFollowQueryRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return paginated following', async () => {
      const currentUserId = 1;
      const targetUserId = 2;
      const queryDto = new GetFollowingInputDto();
      queryDto.pageNumber = 1;
      queryDto.pageSize = 10;
      queryDto.userId = targetUserId;

      const query = new GetFollowingQuery(
        currentUserId,
        targetUserId,
        queryDto,
      );

      const mockPaginatedResult = new PaginatedFollowingViewDto();
      mockPaginatedResult.items = [
        {
          id: 3,
          username: 'following1',
          avatarUrl: null,
          followedAt: new Date('2024-01-15T10:30:00.000Z'),
        },
        {
          id: 4,
          username: 'following2',
          avatarUrl: 'https://example.com/avatar.jpg',
          followedAt: new Date('2024-01-16T11:30:00.000Z'),
        },
      ];
      mockPaginatedResult.totalCount = 2;
      mockPaginatedResult.page = 1;
      mockPaginatedResult.pageSize = 10;

      queryRepository.getFollowing.mockResolvedValue(mockPaginatedResult);

      const result = await handler.execute(query);

      expect(result).toEqual(mockPaginatedResult);
      expect(queryRepository.getFollowing).toHaveBeenCalledWith(
        targetUserId,
        queryDto.pageNumber,
        queryDto.pageSize,
      );
    });

    it('should handle empty following list', async () => {
      const currentUserId = 1;
      const targetUserId = 2;
      const queryDto = new GetFollowingInputDto();
      queryDto.pageNumber = 1;
      queryDto.pageSize = 10;
      queryDto.userId = targetUserId;

      const query = new GetFollowingQuery(
        currentUserId,
        targetUserId,
        queryDto,
      );

      const mockPaginatedResult = new PaginatedFollowingViewDto();
      mockPaginatedResult.items = [];
      mockPaginatedResult.totalCount = 0;
      mockPaginatedResult.page = 1;
      mockPaginatedResult.pageSize = 10;

      queryRepository.getFollowing.mockResolvedValue(mockPaginatedResult);

      const result = await handler.execute(query);

      expect(result).toEqual(mockPaginatedResult);
      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      const currentUserId = 1;
      const targetUserId = 2;
      const queryDto = new GetFollowingInputDto();
      queryDto.pageNumber = 2;
      queryDto.pageSize = 5;
      queryDto.userId = targetUserId;

      const query = new GetFollowingQuery(
        currentUserId,
        targetUserId,
        queryDto,
      );

      const mockPaginatedResult = new PaginatedFollowingViewDto();
      mockPaginatedResult.items = [
        {
          id: 6,
          username: 'following6',
          avatarUrl: null,
          followedAt: new Date('2024-01-20T12:30:00.000Z'),
        },
      ];
      mockPaginatedResult.totalCount = 6;
      mockPaginatedResult.page = 2;
      mockPaginatedResult.pageSize = 5;

      queryRepository.getFollowing.mockResolvedValue(mockPaginatedResult);

      const result = await handler.execute(query);

      expect(result).toEqual(mockPaginatedResult);
      expect(queryRepository.getFollowing).toHaveBeenCalledWith(
        targetUserId,
        queryDto.pageNumber,
        queryDto.pageSize,
      );
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(5);
    });
  });
});
