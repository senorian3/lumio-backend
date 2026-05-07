import { Test, TestingModule } from '@nestjs/testing';
import { CommentRepository } from '@lumio/modules/posts/domain/infrastructure/comment.repository';
import {
  CreateCommentCommandHandler,
  CreateCommentCommand,
} from '@lumio/modules/posts/application/commands/create-comment.command-handler';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';

describe('CreateCommentCommandHandler', () => {
  let handler: CreateCommentCommandHandler;
  let mockCommentRepository: jest.Mocked<CommentRepository>;

  const mockUserId = 1;
  const mockPostId = 'post-123';
  const mockContent = 'Test comment content';
  const mockParentId = 456;

  const mockActivePost = {
    id: mockPostId,
    description: 'Test post',
    likeCount: 0,
    dislikeCount: 0,
    createdAt: new Date(),
    deletedAt: null,
    userId: 2,
  };

  const mockActiveComment = {
    id: mockParentId,
    content: 'Parent comment',
    createdAt: new Date(),
    deletedAt: null,
    userId: 3,
    postId: mockPostId,
    likeCount: 0,
    dislikeCount: 0,
    parentId: null,
    rootId: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCommentCommandHandler,
        {
          provide: CommentRepository,
          useValue: {
            findExistingAndActivePost: jest.fn(),
            findActiveCommentById: jest.fn(),
            createComment: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<CreateCommentCommandHandler>(
      CreateCommentCommandHandler,
    );
    mockCommentRepository = module.get(CommentRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should create a comment successfully', async () => {
      const command = new CreateCommentCommand(
        mockUserId,
        mockPostId,
        mockContent,
      );

      mockCommentRepository.findExistingAndActivePost.mockResolvedValue(
        mockActivePost,
      );
      mockCommentRepository.createComment.mockResolvedValue({ commentId: 789 });

      const result = await handler.execute(command);

      expect(
        mockCommentRepository.findExistingAndActivePost,
      ).toHaveBeenCalledWith(mockPostId);
      expect(mockCommentRepository.createComment).toHaveBeenCalledWith(
        mockUserId,
        mockPostId,
        mockContent,
        undefined,
      );
      expect(result).toEqual({ commentId: 789 });
    });

    it('should create a reply comment with parentId successfully', async () => {
      const command = new CreateCommentCommand(
        mockUserId,
        mockPostId,
        mockContent,
        mockParentId,
      );

      mockCommentRepository.findExistingAndActivePost.mockResolvedValue(
        mockActivePost,
      );
      mockCommentRepository.findActiveCommentById.mockResolvedValue(
        mockActiveComment,
      );
      mockCommentRepository.createComment.mockResolvedValue({ commentId: 789 });

      const result = await handler.execute(command);

      expect(
        mockCommentRepository.findExistingAndActivePost,
      ).toHaveBeenCalledWith(mockPostId);
      expect(mockCommentRepository.findActiveCommentById).toHaveBeenCalledWith(
        mockParentId,
      );
      expect(mockCommentRepository.createComment).toHaveBeenCalledWith(
        mockUserId,
        mockPostId,
        mockContent,
        mockParentId,
      );
      expect(result).toEqual({ commentId: 789 });
    });

    it('should throw NotFoundDomainException when post is not found', async () => {
      const command = new CreateCommentCommand(
        mockUserId,
        mockPostId,
        mockContent,
      );

      mockCommentRepository.findExistingAndActivePost.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundDomainException,
      );

      expect(
        mockCommentRepository.findExistingAndActivePost,
      ).toHaveBeenCalledWith(mockPostId);
      expect(mockCommentRepository.createComment).not.toHaveBeenCalled();
    });

    it('should throw NotFoundDomainException when parent comment is not found', async () => {
      const command = new CreateCommentCommand(
        mockUserId,
        mockPostId,
        mockContent,
        mockParentId,
      );

      mockCommentRepository.findExistingAndActivePost.mockResolvedValue(
        mockActivePost,
      );
      mockCommentRepository.findActiveCommentById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundDomainException,
      );

      expect(
        mockCommentRepository.findExistingAndActivePost,
      ).toHaveBeenCalledWith(mockPostId);
      expect(mockCommentRepository.findActiveCommentById).toHaveBeenCalledWith(
        mockParentId,
      );
      expect(mockCommentRepository.createComment).not.toHaveBeenCalled();
    });

    it('should throw BadRequestDomainException when parent comment does not belong to the post', async () => {
      const command = new CreateCommentCommand(
        mockUserId,
        mockPostId,
        mockContent,
        mockParentId,
      );

      const commentFromDifferentPost = {
        ...mockActiveComment,
        postId: 'different-post',
      };

      mockCommentRepository.findExistingAndActivePost.mockResolvedValue(
        mockActivePost,
      );
      mockCommentRepository.findActiveCommentById.mockResolvedValue(
        commentFromDifferentPost,
      );

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );

      expect(
        mockCommentRepository.findExistingAndActivePost,
      ).toHaveBeenCalledWith(mockPostId);
      expect(mockCommentRepository.findActiveCommentById).toHaveBeenCalledWith(
        mockParentId,
      );
      expect(mockCommentRepository.createComment).not.toHaveBeenCalled();
    });

    it('should handle database error when finding post', async () => {
      const command = new CreateCommentCommand(
        mockUserId,
        mockPostId,
        mockContent,
      );
      const dbError = new Error('Database connection failed');

      mockCommentRepository.findExistingAndActivePost.mockRejectedValue(
        dbError,
      );

      await expect(handler.execute(command)).rejects.toThrow(dbError);
      expect(mockCommentRepository.createComment).not.toHaveBeenCalled();
    });
  });
});
