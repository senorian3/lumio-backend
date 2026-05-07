import { Test, TestingModule } from '@nestjs/testing';
import { QueryPostRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import {
  GetCreatedCommentQueryHandler,
  GetCreatedCommentQuery,
} from '@lumio/modules/posts/application/queries/get-created-comment.query-handler';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';

describe('GetCreatedCommentQueryHandler', () => {
  let handler: GetCreatedCommentQueryHandler;
  let mockQueryPostRepository: jest.Mocked<QueryPostRepository>;

  const mockCommentId = 123;
  const mockUserId = 1;

  const mockComment = {
    id: mockCommentId,
    content: 'Test comment',
    likeCount: 0,
    dislikeCount: 0,
    createdAt: new Date(),
    deletedAt: null,
    userId: mockUserId,
    postId: 'post-123',
    parentId: null,
    rootId: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCreatedCommentQueryHandler,
        {
          provide: QueryPostRepository,
          useValue: {
            findCommentById: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetCreatedCommentQueryHandler>(
      GetCreatedCommentQueryHandler,
    );
    mockQueryPostRepository = module.get(QueryPostRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return comment successfully', async () => {
      const query = new GetCreatedCommentQuery(mockCommentId, mockUserId);

      mockQueryPostRepository.findCommentById.mockResolvedValue(mockComment);

      const result = await handler.execute(query);

      expect(mockQueryPostRepository.findCommentById).toHaveBeenCalledWith(
        mockCommentId,
      );
      expect(result).toEqual(mockComment);
    });

    it('should throw BadRequestDomainException when comment is not found', async () => {
      const query = new GetCreatedCommentQuery(mockCommentId, mockUserId);

      mockQueryPostRepository.findCommentById.mockResolvedValue(null);

      await expect(handler.execute(query)).rejects.toThrow(
        BadRequestDomainException,
      );

      expect(mockQueryPostRepository.findCommentById).toHaveBeenCalledWith(
        mockCommentId,
      );
    });

    it('should handle database error when finding comment', async () => {
      const query = new GetCreatedCommentQuery(mockCommentId, mockUserId);
      const dbError = new Error('Database connection failed');

      mockQueryPostRepository.findCommentById.mockRejectedValue(dbError);

      await expect(handler.execute(query)).rejects.toThrow(dbError);

      expect(mockQueryPostRepository.findCommentById).toHaveBeenCalledWith(
        mockCommentId,
      );
    });
  });
});
