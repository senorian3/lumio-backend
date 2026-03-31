import { Test, TestingModule } from '@nestjs/testing';
import {
  GetPostsQueryHandler,
  GetPostsQuery,
} from '@super-admin/modules/posts/application/queries/get-posts.query-handler';
import { PostsQueryRepository } from '@super-admin/modules/posts/domain/infrastructure/posts.query-repository';
import { PostSortBy } from '@super-admin/modules/posts/domain/schema/post/post-sort-by.enum';

describe('GetPostsQueryHandler', () => {
  let handler: GetPostsQueryHandler;

  const mockPostsQueryRepository = {
    findPosts: jest.fn(),
    countPosts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPostsQueryHandler,
        {
          provide: PostsQueryRepository,
          useValue: mockPostsQueryRepository,
        },
      ],
    }).compile();

    handler = module.get<GetPostsQueryHandler>(GetPostsQueryHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return paginated posts successfully', async () => {
      const query = new GetPostsQuery(1, 10, PostSortBy.DATE_DESC, undefined);
      const mockPrismaPosts = [
        {
          id: 1,
          description: 'Test post 1',
          createdAt: new Date('2024-01-01'),
          deletedAt: null,
          userId: 1,
          user: { id: 1, username: 'user1' },
          files: [{ id: 1, url: 'file1.jpg' }],
        },
        {
          id: 2,
          description: 'Test post 2',
          createdAt: new Date('2024-01-02'),
          deletedAt: null,
          userId: 2,
          user: { id: 2, username: 'user2' },
          files: [],
        },
      ];

      mockPostsQueryRepository.findPosts.mockResolvedValue(mockPrismaPosts);
      mockPostsQueryRepository.countPosts.mockResolvedValue(2);

      const result = await handler.execute(query);

      expect(result).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalCount).toBe(2);
      expect(result.pagesCount).toBe(1);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe(1);
      expect(result.items[0].description).toBe('Test post 1');
      expect(result.items[1].id).toBe(2);
    });

    it('should return empty result when no posts found', async () => {
      const query = new GetPostsQuery(1, 10, PostSortBy.DATE_DESC, undefined);

      mockPostsQueryRepository.findPosts.mockResolvedValue([]);
      mockPostsQueryRepository.countPosts.mockResolvedValue(0);

      const result = await handler.execute(query);

      expect(result).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalCount).toBe(0);
      expect(result.pagesCount).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    it('should calculate pages count correctly', async () => {
      const query = new GetPostsQuery(1, 5, PostSortBy.DATE_DESC, undefined);

      mockPostsQueryRepository.findPosts.mockResolvedValue([]);
      mockPostsQueryRepository.countPosts.mockResolvedValue(23);

      const result = await handler.execute(query);

      expect(result.pagesCount).toBe(5); // ceil(23/5) = 5
    });

    it('should handle search parameter', async () => {
      const query = new GetPostsQuery(1, 10, PostSortBy.DATE_DESC, 'testuser');

      mockPostsQueryRepository.findPosts.mockResolvedValue([]);
      mockPostsQueryRepository.countPosts.mockResolvedValue(0);

      await handler.execute(query);

      expect(mockPostsQueryRepository.findPosts).toHaveBeenCalledWith(
        1,
        10,
        PostSortBy.DATE_DESC,
        'testuser',
      );
    });

    it('should handle DATE_ASC sort order', async () => {
      const query = new GetPostsQuery(1, 10, PostSortBy.DATE_ASC, undefined);

      mockPostsQueryRepository.findPosts.mockResolvedValue([]);
      mockPostsQueryRepository.countPosts.mockResolvedValue(0);

      await handler.execute(query);

      expect(mockPostsQueryRepository.findPosts).toHaveBeenCalledWith(
        1,
        10,
        PostSortBy.DATE_ASC,
        undefined,
      );
    });

    it('should handle USERNAME_ASC sort order', async () => {
      const query = new GetPostsQuery(
        1,
        10,
        PostSortBy.USERNAME_ASC,
        undefined,
      );

      mockPostsQueryRepository.findPosts.mockResolvedValue([]);
      mockPostsQueryRepository.countPosts.mockResolvedValue(0);

      await handler.execute(query);

      expect(mockPostsQueryRepository.findPosts).toHaveBeenCalledWith(
        1,
        10,
        PostSortBy.USERNAME_ASC,
        undefined,
      );
    });

    it('should map post files correctly', async () => {
      const query = new GetPostsQuery(1, 10, PostSortBy.DATE_DESC, undefined);
      const mockPrismaPosts = [
        {
          id: 1,
          description: 'Test post',
          createdAt: new Date('2024-01-01'),
          deletedAt: null,
          userId: 1,
          user: { id: 1, username: 'user1' },
          files: [
            { id: 10, url: 'file1.jpg' },
            { id: 11, url: 'file2.jpg' },
          ],
        },
      ];

      mockPostsQueryRepository.findPosts.mockResolvedValue(mockPrismaPosts);
      mockPostsQueryRepository.countPosts.mockResolvedValue(1);

      const result = await handler.execute(query);

      expect(result.items[0].files).toHaveLength(2);
      expect(result.items[0].files[0].id).toBe(10);
      expect(result.items[0].files[1].url).toBe('file2.jpg');
    });

    it('should handle posts with null user', async () => {
      const query = new GetPostsQuery(1, 10, PostSortBy.DATE_DESC, undefined);
      const mockPrismaPosts = [
        {
          id: 1,
          description: 'Test post',
          createdAt: new Date('2024-01-01'),
          deletedAt: null,
          userId: 1,
          user: null,
          files: [],
        },
      ];

      mockPostsQueryRepository.findPosts.mockResolvedValue(mockPrismaPosts);
      mockPostsQueryRepository.countPosts.mockResolvedValue(1);

      const result = await handler.execute(query);

      expect(result.items[0].user).toBeNull();
    });
  });
});
