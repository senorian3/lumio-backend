import { Test, TestingModule } from '@nestjs/testing';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { ExternalQueryUserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import {
  GetMainPageQueryHandler,
  GetMainPageQuery,
} from '@lumio/modules/posts/application/queries/get-main-page.query-handler';
import { GetMainPageInputDto } from '@lumio/modules/posts/api/dto/input/get-main-page.input.dto';
import { MainPageView } from '@lumio/modules/posts/api/dto/output/main-page.output.dto';
import { PostView } from '@lumio/modules/posts/api/dto/output/post.output.dto';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';

describe('GetMainPageQueryHandler', () => {
  let handler: GetMainPageQueryHandler;
  let mockPostRepository: jest.Mocked<PostRepository>;
  let mockExternalQueryUserRepository: jest.Mocked<ExternalQueryUserRepository>;

  const mockPaginationParams = new GetMainPageInputDto();
  mockPaginationParams.pageNumber = 1;
  mockPaginationParams.pageSize = 4;

  const mockPostsFromDb = [
    {
      id: 1,
      description: 'First post',
      createdAt: new Date('2024-01-01'),
      deletedAt: null,
      userId: 1,
      files: [{ id: 1, url: 'https://example.com/file1.jpg', postId: 1 }],
    },
    {
      id: 2,
      description: 'Second post',
      createdAt: new Date('2024-01-02'),
      deletedAt: null,
      userId: 2,
      files: [],
    },
  ];

  const mockPostViews: PostView[] = [
    {
      id: 1,
      description: 'First post',
      createdAt: new Date('2024-01-01'),
      userId: 1,
      postFiles: [{ id: 1, url: 'https://example.com/file1.jpg', postId: 1 }],
    },
    {
      id: 2,
      description: 'Second post',
      createdAt: new Date('2024-01-02'),
      userId: 2,
      postFiles: [],
    },
  ];

  const mockPaginatedPosts: PaginatedViewDto<PostView[]> = {
    page: 1,
    pageSize: 4,
    pagesCount: 1,
    totalCount: 2,
    items: mockPostViews,
  };

  const mockRegisteredUsersCount = 150;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMainPageQueryHandler,
        {
          provide: PostRepository,
          useValue: {
            getPostsWithPagination: jest.fn(),
          },
        },
        {
          provide: ExternalQueryUserRepository,
          useValue: {
            getAllRegisteredUsersCount: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetMainPageQueryHandler>(GetMainPageQueryHandler);
    mockPostRepository = module.get(PostRepository);
    mockExternalQueryUserRepository = module.get(ExternalQueryUserRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return main page view with posts and user count successfully', async () => {
      // Arrange
      const query = new GetMainPageQuery(mockPaginationParams);

      mockPostRepository.getPostsWithPagination.mockResolvedValue({
        posts: mockPostsFromDb,
        totalCount: 2,
      });
      mockExternalQueryUserRepository.getAllRegisteredUsersCount.mockResolvedValue(
        mockRegisteredUsersCount,
      );

      // Mock PostView.fromPrisma
      jest.spyOn(PostView, 'fromPrisma').mockImplementation((post) => {
        const index = mockPostsFromDb.findIndex((p) => p.id === post.id);
        return mockPostViews[index];
      });

      // Mock PaginatedViewDto.mapToView
      jest
        .spyOn(PaginatedViewDto, 'mapToView')
        .mockReturnValue(mockPaginatedPosts);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockPostRepository.getPostsWithPagination).toHaveBeenCalledWith(
        mockPaginationParams.calculateSkip(),
        mockPaginationParams.pageSize,
      );
      expect(
        mockExternalQueryUserRepository.getAllRegisteredUsersCount,
      ).toHaveBeenCalled();
      expect(PostView.fromPrisma).toHaveBeenCalledTimes(2);
      expect(PaginatedViewDto.mapToView).toHaveBeenCalledWith({
        items: mockPostViews,
        page: mockPaginationParams.pageNumber,
        size: mockPaginationParams.pageSize,
        totalCount: 2,
      });

      expect(result).toBeInstanceOf(MainPageView);
      expect(result.posts).toEqual(mockPaginatedPosts);
      expect(result.allRegisteredUsersCount).toBe(mockRegisteredUsersCount);
    });

    it('should handle empty posts result', async () => {
      // Arrange
      const query = new GetMainPageQuery(mockPaginationParams);

      mockPostRepository.getPostsWithPagination.mockResolvedValue({
        posts: [],
        totalCount: 0,
      });
      mockExternalQueryUserRepository.getAllRegisteredUsersCount.mockResolvedValue(
        50,
      );

      const emptyPaginatedPosts: PaginatedViewDto<PostView[]> = {
        page: 1,
        pageSize: 4,
        pagesCount: 0,
        totalCount: 0,
        items: [],
      };

      // Mock PaginatedViewDto.mapToView
      jest
        .spyOn(PaginatedViewDto, 'mapToView')
        .mockReturnValue(emptyPaginatedPosts);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.posts.items).toEqual([]);
      expect(result.posts.totalCount).toBe(0);
      expect(result.allRegisteredUsersCount).toBe(50);
    });

    it('should handle different pagination parameters', async () => {
      // Arrange
      const customParams = new GetMainPageInputDto();
      customParams.pageNumber = 2;
      customParams.pageSize = 8;

      const query = new GetMainPageQuery(customParams);

      mockPostRepository.getPostsWithPagination.mockResolvedValue({
        posts: mockPostsFromDb,
        totalCount: 15,
      });
      mockExternalQueryUserRepository.getAllRegisteredUsersCount.mockResolvedValue(
        200,
      );

      jest.spyOn(PostView, 'fromPrisma').mockImplementation((post) => {
        const index = mockPostsFromDb.findIndex((p) => p.id === post.id);
        return mockPostViews[index];
      });

      const paginatedResult: PaginatedViewDto<PostView[]> = {
        page: 2,
        pageSize: 8,
        pagesCount: 2,
        totalCount: 15,
        items: mockPostViews,
      };

      jest
        .spyOn(PaginatedViewDto, 'mapToView')
        .mockReturnValue(paginatedResult);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockPostRepository.getPostsWithPagination).toHaveBeenCalledWith(
        customParams.calculateSkip(),
        8,
      );
      expect(result.posts.page).toBe(2);
      expect(result.posts.pageSize).toBe(8);
      expect(result.posts.pagesCount).toBe(2);
      expect(result.posts.totalCount).toBe(15);
      expect(result.allRegisteredUsersCount).toBe(200);
    });

    it('should handle database error when getting posts', async () => {
      // Arrange
      const query = new GetMainPageQuery(mockPaginationParams);
      const dbError = new Error('Database connection failed');

      mockPostRepository.getPostsWithPagination.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);

      expect(mockPostRepository.getPostsWithPagination).toHaveBeenCalledWith(
        mockPaginationParams.calculateSkip(),
        mockPaginationParams.pageSize,
      );
      expect(
        mockExternalQueryUserRepository.getAllRegisteredUsersCount,
      ).not.toHaveBeenCalled();
    });

    it('should handle database error when getting user count', async () => {
      // Arrange
      const query = new GetMainPageQuery(mockPaginationParams);
      const dbError = new Error('Database connection failed');

      mockPostRepository.getPostsWithPagination.mockResolvedValue({
        posts: mockPostsFromDb,
        totalCount: 2,
      });
      mockExternalQueryUserRepository.getAllRegisteredUsersCount.mockRejectedValue(
        dbError,
      );

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);

      expect(mockPostRepository.getPostsWithPagination).toHaveBeenCalled();
      expect(
        mockExternalQueryUserRepository.getAllRegisteredUsersCount,
      ).toHaveBeenCalled();
    });
  });
});
