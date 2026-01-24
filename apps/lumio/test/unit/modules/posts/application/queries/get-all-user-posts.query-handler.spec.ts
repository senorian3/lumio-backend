import { Test, TestingModule } from '@nestjs/testing';
import { QueryPostRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import {
  GetAllUserPostsQueryHandler,
  GetAllUserPostsQuery,
} from '@lumio/modules/posts/application/queries/get-all-user-posts.query-handler';
import {
  GetPostsQueryParams,
  PostsSortBy,
} from '@lumio/modules/posts/api/dto/input/get-all-user-posts.query.dto';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { SortDirection } from '@libs/core/dto/pagination/base.query-params.input-dto';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';

describe('GetAllUserPostsQueryHandler', () => {
  let handler: GetAllUserPostsQueryHandler;
  let mockQueryPostRepository: jest.Mocked<QueryPostRepository>;

  const mockUserId = 1;

  const mockUserProfile = {
    id: mockUserId,
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-01'),
    country: 'USA',
    city: 'NY',
    aboutMe: 'Test user',
    avatarUrl: null,
    profileFilled: false,
    profileFilledAt: null,
    profileUpdatedAt: null,
    accountType: 'regular',
    userId: mockUserId,
    user: {} as any,
  };

  const mockPosts: PostEntity[] = [
    {
      id: 1,
      description: 'First post',
      createdAt: new Date('2024-01-01'),
      deletedAt: null,
      userId: mockUserId,
      user: {
        id: mockUserId,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed',
        createdAt: new Date(),
        deletedAt: null,
        profile: mockUserProfile,
      },
      files: [],
    },
    {
      id: 2,
      description: 'Second post',
      createdAt: new Date('2024-01-02'),
      deletedAt: null,
      userId: mockUserId,
      user: {
        id: mockUserId,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed',
        createdAt: new Date(),
        deletedAt: null,
        profile: mockUserProfile,
      },
      files: [],
    },
  ];

  const mockPaginatedResult: PaginatedViewDto<PostEntity[]> = {
    page: 1,
    pageSize: 10,
    pagesCount: 1,
    totalCount: 2,
    items: mockPosts,
  };

  const mockQueryParams = new GetPostsQueryParams();
  mockQueryParams.pageNumber = 1;
  mockQueryParams.pageSize = 10;
  mockQueryParams.sortBy = PostsSortBy.CREATED_AT;
  mockQueryParams.sortDirection = SortDirection.Desc;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllUserPostsQueryHandler,
        {
          provide: QueryPostRepository,
          useValue: {
            findUserPosts: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetAllUserPostsQueryHandler>(
      GetAllUserPostsQueryHandler,
    );
    mockQueryPostRepository = module.get(QueryPostRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return paginated posts successfully', async () => {
      // Arrange
      const query = new GetAllUserPostsQuery(mockUserId, mockQueryParams);

      mockQueryPostRepository.findUserPosts.mockResolvedValue(
        mockPaginatedResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockQueryPostRepository.findUserPosts).toHaveBeenCalledWith(
        mockUserId,
        mockQueryParams,
      );
      expect(result).toEqual({
        page: mockPaginatedResult.page,
        pageSize: mockPaginatedResult.pageSize,
        pagesCount: mockPaginatedResult.pagesCount,
        totalCount: mockPaginatedResult.totalCount,
        items: mockPaginatedResult.items,
      });
    });

    it('should return empty result when no posts found', async () => {
      // Arrange
      const query = new GetAllUserPostsQuery(mockUserId, mockQueryParams);
      const emptyResult: PaginatedViewDto<PostEntity[]> = {
        page: 1,
        pageSize: 10,
        pagesCount: 0,
        totalCount: 0,
        items: [],
      };

      mockQueryPostRepository.findUserPosts.mockResolvedValue(emptyResult);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual({
        page: 1,
        pageSize: 10,
        pagesCount: 0,
        totalCount: 0,
        items: [],
      });
    });

    it('should handle different pagination parameters', async () => {
      // Arrange
      const customQueryParams = new GetPostsQueryParams();
      customQueryParams.pageNumber = 2;
      customQueryParams.pageSize = 5;
      customQueryParams.sortBy = PostsSortBy.CREATED_AT;
      customQueryParams.sortDirection = SortDirection.Asc;

      const query = new GetAllUserPostsQuery(mockUserId, customQueryParams);
      const paginatedResult: PaginatedViewDto<PostEntity[]> = {
        page: 2,
        pageSize: 5,
        pagesCount: 2,
        totalCount: 8,
        items: [mockPosts[0]], // Only one item for page 2
      };

      mockQueryPostRepository.findUserPosts.mockResolvedValue(paginatedResult);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockQueryPostRepository.findUserPosts).toHaveBeenCalledWith(
        mockUserId,
        customQueryParams,
      );
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(5);
      expect(result.pagesCount).toBe(2);
      expect(result.totalCount).toBe(8);
      expect(result.items).toHaveLength(1);
    });

    it('should handle database error when finding posts', async () => {
      // Arrange
      const query = new GetAllUserPostsQuery(mockUserId, mockQueryParams);
      const dbError = new Error('Database connection failed');

      mockQueryPostRepository.findUserPosts.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);

      expect(mockQueryPostRepository.findUserPosts).toHaveBeenCalledWith(
        mockUserId,
        mockQueryParams,
      );
    });

    it('should handle different sort options', async () => {
      // Arrange
      const sortQueryParams = new GetPostsQueryParams();
      sortQueryParams.pageNumber = 1;
      sortQueryParams.pageSize = 10;
      sortQueryParams.sortBy = PostsSortBy.CREATED_AT;
      sortQueryParams.sortDirection = SortDirection.Asc;

      const query = new GetAllUserPostsQuery(mockUserId, sortQueryParams);

      mockQueryPostRepository.findUserPosts.mockResolvedValue(
        mockPaginatedResult,
      );

      // Act
      await handler.execute(query);

      // Assert
      expect(mockQueryPostRepository.findUserPosts).toHaveBeenCalledWith(
        mockUserId,
        sortQueryParams,
      );
    });
  });
});
