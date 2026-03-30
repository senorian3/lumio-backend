import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { PostResolver } from '@super-admin/modules/posts/api/posts.resolver';
import { GetPostsQuery } from '@super-admin/modules/posts/application/queries/get-posts.query-handler';
import { PostSortBy } from '@super-admin/modules/posts/domain/schema/post/post-sort-by.enum';
import { SuperAdminJwtGuard } from '@super-admin/core/guard/jwt/super-admin-jwt.guard';

describe('PostResolver', () => {
  let resolver: PostResolver;

  const mockQueryBus = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostResolver,
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    })
      .overrideGuard(SuperAdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<PostResolver>(PostResolver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getPosts', () => {
    it('should return paginated posts with default parameters', async () => {
      const mockResponse = {
        page: 1,
        pageSize: 20,
        totalCount: 2,
        pagesCount: 1,
        items: [
          { id: 1, description: 'Post 1', files: [] },
          { id: 2, description: 'Post 2', files: [] },
        ],
      };
      mockQueryBus.execute.mockResolvedValue(mockResponse);

      const result = await resolver.getPosts(1, 20, PostSortBy.DATE_DESC);

      expect(result).toEqual(mockResponse);
      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        new GetPostsQuery(1, 20, PostSortBy.DATE_DESC, undefined),
      );
    });

    it('should pass search parameter to query', async () => {
      const mockResponse = {
        page: 1,
        pageSize: 20,
        totalCount: 0,
        pagesCount: 0,
        items: [],
      };
      mockQueryBus.execute.mockResolvedValue(mockResponse);

      await resolver.getPosts(1, 20, PostSortBy.DATE_DESC, 'testuser');

      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        new GetPostsQuery(1, 20, PostSortBy.DATE_DESC, 'testuser'),
      );
    });

    it('should handle DATE_ASC sort order', async () => {
      const mockResponse = {
        page: 1,
        pageSize: 20,
        totalCount: 0,
        pagesCount: 0,
        items: [],
      };
      mockQueryBus.execute.mockResolvedValue(mockResponse);

      await resolver.getPosts(1, 20, PostSortBy.DATE_ASC);

      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        new GetPostsQuery(1, 20, PostSortBy.DATE_ASC, undefined),
      );
    });

    it('should handle USERNAME_ASC sort order', async () => {
      const mockResponse = {
        page: 1,
        pageSize: 20,
        totalCount: 0,
        pagesCount: 0,
        items: [],
      };
      mockQueryBus.execute.mockResolvedValue(mockResponse);

      await resolver.getPosts(1, 20, PostSortBy.USERNAME_ASC);

      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        new GetPostsQuery(1, 20, PostSortBy.USERNAME_ASC, undefined),
      );
    });

    it('should handle pagination parameters', async () => {
      const mockResponse = {
        page: 3,
        pageSize: 5,
        totalCount: 20,
        pagesCount: 4,
        items: [],
      };
      mockQueryBus.execute.mockResolvedValue(mockResponse);

      const result = await resolver.getPosts(3, 5, PostSortBy.DATE_DESC);

      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(5);
      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        new GetPostsQuery(3, 5, PostSortBy.DATE_DESC, undefined),
      );
    });
  });

  describe('user (ResolveField)', () => {
    it('should return user from post', async () => {
      const post = { id: 1, user: { id: 100, username: 'testuser' } };

      const result = await resolver.user(post as any);

      expect(result).toEqual({ id: 100, username: 'testuser' });
    });

    it('should return null when post has no user', async () => {
      const post = { id: 1, user: null };

      const result = await resolver.user(post as any);

      expect(result).toBeNull();
    });

    it('should return null when user is undefined', async () => {
      const post = { id: 1, user: undefined };

      const result = await resolver.user(post as any);

      expect(result).toBeNull();
    });
  });

  describe('files (ResolveField)', () => {
    it('should return files from post', async () => {
      const post = {
        id: 1,
        files: [
          { id: 1, url: 'file1.jpg' },
          { id: 2, url: 'file2.jpg' },
        ],
      };

      const result = await resolver.files(post as any);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
    });

    it('should return empty array when post has no files', async () => {
      const post = { id: 1, files: [] };

      const result = await resolver.files(post as any);

      expect(result).toEqual([]);
    });

    it('should return empty array when files is undefined', async () => {
      const post = { id: 1, files: undefined };

      const result = await resolver.files(post as any);

      expect(result).toEqual([]);
    });
  });
});
