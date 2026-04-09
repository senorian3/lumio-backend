import { Test, TestingModule } from '@nestjs/testing';
import { CommentRepository } from '@lumio/modules/posts/domain/infrastructure/comment.repository';
import {
  LikeCommentCommandHandler,
  LikeCommentCommand,
} from '@lumio/modules/posts/application/commands/like-comment.command-handler';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';

describe('LikeCommentCommandHandler', () => {
  let handler: LikeCommentCommandHandler;
  let mockCommentRepository: jest.Mocked<CommentRepository>;

  const mockUserId = 1;
  const mockCommentId = 123;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikeCommentCommandHandler,
        {
          provide: CommentRepository,
          useValue: {
            findActiveCommentById: jest.fn(),
            updateCommentLike: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<LikeCommentCommandHandler>(LikeCommentCommandHandler);
    mockCommentRepository = module.get(CommentRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should successfully add like to comment', async () => {
      // Arrange
      const command = new LikeCommentCommand(mockUserId, mockCommentId, 'like');
      mockCommentRepository.findActiveCommentById.mockResolvedValue({
        id: mockCommentId,
        content: 'Test comment',
        createdAt: new Date(),
        deletedAt: null,
        userId: 2,
        postId: 'post-123',
        likeCount: 0,
        dislikeCount: 0,
        parentId: null,
        rootId: null,
      });

      // Act
      await handler.execute(command);

      // Assert
      expect(mockCommentRepository.findActiveCommentById).toHaveBeenCalledWith(
        mockCommentId,
      );
      expect(mockCommentRepository.updateCommentLike).toHaveBeenCalledWith(
        mockCommentId,
        mockUserId,
        'like',
      );
    });

    it('should successfully add dislike to comment', async () => {
      // Arrange
      const command = new LikeCommentCommand(
        mockUserId,
        mockCommentId,
        'dislike',
      );
      mockCommentRepository.findActiveCommentById.mockResolvedValue({
        id: mockCommentId,
        content: 'Test comment',
        createdAt: new Date(),
        deletedAt: null,
        userId: 2,
        postId: 'post-123',
        likeCount: 0,
        dislikeCount: 0,
        parentId: null,
        rootId: null,
      });

      // Act
      await handler.execute(command);

      // Assert
      expect(mockCommentRepository.findActiveCommentById).toHaveBeenCalledWith(
        mockCommentId,
      );
      expect(mockCommentRepository.updateCommentLike).toHaveBeenCalledWith(
        mockCommentId,
        mockUserId,
        'dislike',
      );
    });

    it('should successfully remove reaction (status = none)', async () => {
      // Arrange
      const command = new LikeCommentCommand(mockUserId, mockCommentId, 'none');
      mockCommentRepository.findActiveCommentById.mockResolvedValue({
        id: mockCommentId,
        content: 'Test comment',
        createdAt: new Date(),
        deletedAt: null,
        userId: 2,
        postId: 'post-123',
        likeCount: 0,
        dislikeCount: 0,
        parentId: null,
        rootId: null,
      });

      // Act
      await handler.execute(command);

      // Assert
      expect(mockCommentRepository.findActiveCommentById).toHaveBeenCalledWith(
        mockCommentId,
      );
      expect(mockCommentRepository.updateCommentLike).toHaveBeenCalledWith(
        mockCommentId,
        mockUserId,
        'none',
      );
    });

    it('should throw NotFoundDomainException when comment does not exist', async () => {
      // Arrange
      const command = new LikeCommentCommand(mockUserId, mockCommentId, 'like');
      mockCommentRepository.findActiveCommentById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundDomainException,
      );
      expect(mockCommentRepository.findActiveCommentById).toHaveBeenCalledWith(
        mockCommentId,
      );
      expect(mockCommentRepository.updateCommentLike).not.toHaveBeenCalled();
    });

    it('should throw BadRequestDomainException when status is invalid', async () => {
      // Arrange
      const command = new LikeCommentCommand(
        mockUserId,
        mockCommentId,
        'invalid' as any,
      );
      mockCommentRepository.findActiveCommentById.mockResolvedValue({
        id: mockCommentId,
        content: 'Test comment',
        createdAt: new Date(),
        deletedAt: null,
        userId: 2,
        postId: 'post-123',
        likeCount: 0,
        dislikeCount: 0,
        parentId: null,
        rootId: null,
      });

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );
      expect(mockCommentRepository.findActiveCommentById).toHaveBeenCalledWith(
        mockCommentId,
      );
      expect(mockCommentRepository.updateCommentLike).not.toHaveBeenCalled();
    });

    it('should handle database error when finding comment', async () => {
      // Arrange
      const command = new LikeCommentCommand(mockUserId, mockCommentId, 'like');
      const dbError = new Error('Database connection failed');
      mockCommentRepository.findActiveCommentById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);
      expect(mockCommentRepository.findActiveCommentById).toHaveBeenCalledWith(
        mockCommentId,
      );
      expect(mockCommentRepository.updateCommentLike).not.toHaveBeenCalled();
    });

    it('should handle database error when updating like', async () => {
      // Arrange
      const command = new LikeCommentCommand(mockUserId, mockCommentId, 'like');
      mockCommentRepository.findActiveCommentById.mockResolvedValue({
        id: mockCommentId,
        content: 'Test comment',
        createdAt: new Date(),
        deletedAt: null,
        userId: 2,
        postId: 'post-123',
        likeCount: 0,
        dislikeCount: 0,
        parentId: null,
        rootId: null,
      });
      const dbError = new Error('Database update failed');
      mockCommentRepository.updateCommentLike.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);
      expect(mockCommentRepository.findActiveCommentById).toHaveBeenCalledWith(
        mockCommentId,
      );
      expect(mockCommentRepository.updateCommentLike).toHaveBeenCalledWith(
        mockCommentId,
        mockUserId,
        'like',
      );
    });
  });
});
