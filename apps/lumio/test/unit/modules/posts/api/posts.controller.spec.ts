import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from '@lumio/modules/posts/api/posts.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@lumio/core/guards/bearer/jwt-optional-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { InputCreatePostDto } from '@lumio/modules/posts/api/dto/input/create-post.input.dto';
import { InputUpdatePostDto } from '@lumio/modules/posts/api/dto/input/update-post.input.dto';
import {
  GetPostsQueryParams,
  PostsSortBy,
} from '@lumio/modules/posts/api/dto/input/get-all-user-posts.query.dto';
import { SortDirection } from '@libs/core/dto/pagination/base.query-params.input-dto';
import { PostView } from '@lumio/modules/posts/api/dto/output/post.output.dto';
import { PaginatedPostViewDto } from '@lumio/modules/posts/api/dto/output/posts.paginated.view-dto';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import { FileValidationPipe } from '@libs/core/pipe/validation/validation-files.pipe';

describe('PostsController', () => {
  let postsController: PostsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  const mockPostView: PostView = {
    id: 'post-123',
    description: 'Test post description',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    userId: 1,

    postFiles: [
      new OutputFileType(1, 'https://example.com/file.jpg', 'post-123'),
    ],
  };

  const mockPaginatedPosts: PaginatedPostViewDto = new PaginatedPostViewDto(
    [mockPostView],
    1,
    1,
    10,
    'user',
  );

  const mockFiles = [
    {
      originalname: 'image1.jpg',
      mimetype: 'image/jpeg',
      size: 1024 * 1024,
      buffer: Buffer.from('test'),
    },
  ] as Express.Multer.File[];

  const mockOutputFiles: OutputFileType[] = [
    new OutputFileType(1, 'https://example.com/file1.jpg', 'post-123'),
    new OutputFileType(2, 'https://example.com/file2.jpg', 'post-123'),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(OptionalJwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overridePipe(FileValidationPipe)
      .useValue({ transform: jest.fn(() => mockFiles) })
      .compile();

    postsController = module.get<PostsController>(PostsController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  describe('getAllUserPosts', () => {
    it('should return paginated posts for user', async () => {
      const userId = 1;
      const currentUserId = 1;
      const queryParams: GetPostsQueryParams = {
        pageNumber: 1,
        pageSize: 10,
        sortBy: PostsSortBy.CREATED_AT,
        sortDirection: SortDirection.Desc,
        calculateSkip: () => 0,
      };

      queryBus.execute.mockResolvedValue(mockPaginatedPosts);

      const result = await postsController.getAllUserPosts(
        userId,
        queryParams,
        currentUserId,
      );

      expect(result).toEqual(mockPaginatedPosts);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: currentUserId,
          query: queryParams,
          userIdParam: userId,
        }),
      );
    });

    it('should return posts for anonymous user', async () => {
      const userId = 1;
      const currentUserId = null; // Anonymous user
      const queryParams: GetPostsQueryParams = {
        pageNumber: 1,
        pageSize: 10,
        sortBy: PostsSortBy.CREATED_AT,
        sortDirection: SortDirection.Desc,
        calculateSkip: () => 0,
      };

      queryBus.execute.mockResolvedValue(mockPaginatedPosts);

      const result = await postsController.getAllUserPosts(
        userId,
        queryParams,
        currentUserId,
      );

      expect(result).toEqual(mockPaginatedPosts);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: currentUserId,
          query: queryParams,
          userIdParam: userId,
        }),
      );
    });
  });

  describe('getProfilePost', () => {
    it('should return profile post by postId', async () => {
      const profileId = 1;
      const postId = 'post-123';

      queryBus.execute.mockResolvedValue(mockPostView);

      const result = await postsController.getProfilePost(profileId, postId);

      expect(result).toEqual(mockPostView);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ profileId, postId }),
      );
    });
  });

  describe('createPost', () => {
    it('should create new post with files', async () => {
      const userId = 1;
      const createPostDto: InputCreatePostDto = {
        description: 'Test post description',
      };

      const commandResult = {
        files: mockOutputFiles,
        postId: 'new-post-123',
      };

      commandBus.execute.mockResolvedValueOnce(commandResult);
      queryBus.execute.mockResolvedValueOnce(mockPostView);

      const result = await postsController.createPost(
        userId,
        mockFiles,
        createPostDto,
      );

      expect(result).toEqual(mockPostView);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          description: createPostDto.description,
          files: mockFiles,
        }),
      );
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: commandResult.postId,
          files: commandResult.files,
        }),
      );
    });

    it('should create post without files', async () => {
      const userId = 1;
      const createPostDto: InputCreatePostDto = {
        description: 'Test post without files',
      };
      const emptyFiles: Express.Multer.File[] = [];

      const commandResult = {
        files: [],
        postId: 'new-post-456',
      };

      commandBus.execute.mockResolvedValueOnce(commandResult);
      queryBus.execute.mockResolvedValueOnce({
        ...mockPostView,
        id: 'new-post-456',
        files: [],
      });

      const result = await postsController.createPost(
        userId,
        emptyFiles,
        createPostDto,
      );

      expect(result.id).toBe('new-post-456');
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          description: createPostDto.description,
          files: emptyFiles,
        }),
      );
    });
  });

  describe('updatePost', () => {
    it('should update post description', async () => {
      const postId = 'post-123';
      const userId = 1;
      const updatePostDto: InputUpdatePostDto = {
        description: 'Updated post description',
      };

      commandBus.execute.mockResolvedValue(mockPostView);

      const result = await postsController.updatePost(
        postId,
        updatePostDto,
        userId,
      );

      expect(result).toEqual(mockPostView);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          postId,
          userId,
          description: updatePostDto.description,
        }),
      );
    });
  });

  describe('deletePost', () => {
    it('should delete post', async () => {
      const postId = 'post-123';
      const userId = 1;

      commandBus.execute.mockResolvedValue(undefined);

      await postsController.deletePost(postId, userId);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId, postId }),
      );
    });
  });

  describe('getPostById', () => {
    it('should return post by id', async () => {
      const postId = 'post-123';
      const userId = 1;

      queryBus.execute.mockResolvedValue(mockPostView);

      const result = await postsController.getPostById(postId, userId);

      expect(result).toEqual(mockPostView);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ postId, userId }),
      );
    });
  });
});
