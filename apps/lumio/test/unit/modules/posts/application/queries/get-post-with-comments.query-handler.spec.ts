import { Test, TestingModule } from '@nestjs/testing';
import { QueryPostRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import {
  GetPostWithCommentsQueryHandler,
  GetPostWithCommentsQuery,
} from '@lumio/modules/posts/application/queries/get-post-with-comments.query-handler';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { GetPostCommentsQueryDto } from '@lumio/modules/posts/api/dto/input/get-post-comments.query.dto';

describe('GetPostWithCommentsQueryHandler', () => {
  let handler: GetPostWithCommentsQueryHandler;
  let mockQueryPostRepository: jest.Mocked<QueryPostRepository>;

  const mockPostId = 'post-123';
  const mockUserId = 1;

  const mockPaginatedComments = PaginatedViewDto.mapToView({
    items: [
      {
        id: 1,
        content: 'Root comment',
        likeCount: 0,
        dislikeCount: 0,
        createdAt: new Date(),
        userId: 2,
        username: 'user2',
        avatarUrl: null,
        userReaction: 'none' as const,
        replies: [],
      },
    ],
    page: 1,
    size: 10,
    totalCount: 1,
  });

  const mockEmptyPaginatedComments = PaginatedViewDto.mapToView({
    items: [],
    page: 1,
    size: 10,
    totalCount: 0,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPostWithCommentsQueryHandler,
        {
          provide: QueryPostRepository,
          useValue: {
            exists: jest.fn(),
            findCommentsByPostId: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetPostWithCommentsQueryHandler>(
      GetPostWithCommentsQueryHandler,
    );
    mockQueryPostRepository = module.get(QueryPostRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return comments with pagination successfully', async () => {
      const pagination = new GetPostCommentsQueryDto();
      const query = new GetPostWithCommentsQuery(
        mockPostId,
        mockUserId,
        pagination,
      );

      mockQueryPostRepository.exists.mockResolvedValue(true);
      mockQueryPostRepository.findCommentsByPostId.mockResolvedValue(
        mockPaginatedComments,
      );

      const result = await handler.execute(query);

      expect(mockQueryPostRepository.exists).toHaveBeenCalledWith(mockPostId);
      expect(mockQueryPostRepository.findCommentsByPostId).toHaveBeenCalledWith(
        mockPostId,
        pagination,
        mockUserId,
      );
      expect(result).toEqual(mockPaginatedComments);
      expect(result.items).toHaveLength(1);
    });

    it('should return empty result when there are no comments', async () => {
      const query = new GetPostWithCommentsQuery(mockPostId, mockUserId);

      mockQueryPostRepository.exists.mockResolvedValue(true);
      mockQueryPostRepository.findCommentsByPostId.mockResolvedValue(
        mockEmptyPaginatedComments,
      );

      const result = await handler.execute(query);

      expect(mockQueryPostRepository.exists).toHaveBeenCalledWith(mockPostId);
      expect(mockQueryPostRepository.findCommentsByPostId).toHaveBeenCalledWith(
        mockPostId,
        undefined,
        mockUserId,
      );
      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should throw NotFoundDomainException when post is not found', async () => {
      const query = new GetPostWithCommentsQuery(mockPostId, mockUserId);

      mockQueryPostRepository.exists.mockResolvedValue(false);

      await expect(handler.execute(query)).rejects.toThrow(
        NotFoundDomainException,
      );

      expect(mockQueryPostRepository.exists).toHaveBeenCalledWith(mockPostId);
      expect(
        mockQueryPostRepository.findCommentsByPostId,
      ).not.toHaveBeenCalled();
    });

    it('should handle database error when checking post existence', async () => {
      const query = new GetPostWithCommentsQuery(mockPostId, mockUserId);
      const dbError = new Error('Database connection failed');

      mockQueryPostRepository.exists.mockRejectedValue(dbError);

      await expect(handler.execute(query)).rejects.toThrow(dbError);

      expect(mockQueryPostRepository.exists).toHaveBeenCalledWith(mockPostId);
      expect(
        mockQueryPostRepository.findCommentsByPostId,
      ).not.toHaveBeenCalled();
    });
  });
});
