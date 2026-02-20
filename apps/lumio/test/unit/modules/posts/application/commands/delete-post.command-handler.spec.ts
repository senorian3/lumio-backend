import { Test, TestingModule } from '@nestjs/testing';
import {
  DeletePostCommandHandler,
  DeletePostCommand,
} from '@lumio/modules/posts/application/commands/delete-post.command-handler';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { FilesHttpAdapter } from '@lumio/modules/posts/application/files-http.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import {
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';

describe('DeletePostCommandHandler', () => {
  let handler: DeletePostCommandHandler;
  let mockExternalQueryUserRepository: jest.Mocked<ExternalQueryUserAccountsRepository>;
  let mockPostRepository: jest.Mocked<PostRepository>;
  let mockFilesHttpAdapter: jest.Mocked<FilesHttpAdapter>;
  let mockLogger: jest.Mocked<AppLoggerService>;

  const mockUserId = 1;
  const mockPostId = '100';

  const mockPost = {
    id: mockPostId,
    description: 'Test post',
    createdAt: new Date(),
    deletedAt: null,
    userId: mockUserId,
    user: {
      id: mockUserId,
      username: 'testuser',
      email: 'test@example.com',
      password: 'hash',
      createdAt: new Date(),
      deletedAt: null,
    },
    files: [
      {
        id: 1,
        url: 'https://example.com/file.jpg',
        postId: mockPostId,
        createdAt: new Date(),
        deletedAt: null,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletePostCommandHandler,
        {
          provide: ExternalQueryUserAccountsRepository,
          useValue: {
            findUserId: jest.fn(),
          },
        },
        {
          provide: PostRepository,
          useValue: {
            findById: jest.fn(),
            softDeletePostById: jest.fn(),
          },
        },
        {
          provide: FilesHttpAdapter,
          useValue: {
            delete: jest.fn(),
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<DeletePostCommandHandler>(DeletePostCommandHandler);
    mockExternalQueryUserRepository = module.get(
      ExternalQueryUserAccountsRepository,
    );
    mockPostRepository = module.get(PostRepository);
    mockFilesHttpAdapter = module.get(FilesHttpAdapter);
    mockLogger = module.get(AppLoggerService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should delete post successfully', async () => {
      // Arrange
      const command = new DeletePostCommand(mockUserId, mockPostId);

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockPostRepository.findById.mockResolvedValue(mockPost);
      mockPostRepository.softDeletePostById.mockResolvedValue(undefined);
      mockFilesHttpAdapter.delete.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
      expect(mockPostRepository.softDeletePostById).toHaveBeenCalledWith(
        mockPostId,
      );
      expect(mockFilesHttpAdapter.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundDomainException when user does not exist', async () => {
      // Arrange
      const command = new DeletePostCommand(mockUserId, mockPostId);

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundDomainException,
      );

      try {
        await handler.execute(command);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Not Found');
        expect(error.extensions[0]?.message).toBe('User does not exist');
        expect(error.extensions[0]?.field).toBe('user');
      }

      expect(mockPostRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundDomainException when post does not exist', async () => {
      // Arrange
      const command = new DeletePostCommand(mockUserId, mockPostId);

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockPostRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundDomainException,
      );

      try {
        await handler.execute(command);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Not Found');
        expect(error.extensions[0]?.message).toBe('Post does not exist');
        expect(error.extensions[0]?.field).toBe('post');
      }

      expect(mockPostRepository.softDeletePostById).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenDomainException when post does not belong to user', async () => {
      // Arrange
      const command = new DeletePostCommand(mockUserId, mockPostId);
      const otherUserPost = { ...mockPost, userId: 999 };

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockPostRepository.findById.mockResolvedValue(otherUserPost);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        ForbiddenDomainException,
      );

      try {
        await handler.execute(command);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Forbidden');
        expect(error.extensions[0]?.message).toBe(
          'Post does not belong to the user',
        );
        expect(error.extensions[0]?.field).toBe('post');
      }

      expect(mockPostRepository.softDeletePostById).not.toHaveBeenCalled();
    });

    it('should handle database error when soft deleting post', async () => {
      // Arrange
      const command = new DeletePostCommand(mockUserId, mockPostId);
      const dbError = new Error('Database connection failed');

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockPostRepository.findById.mockResolvedValue(mockPost);
      mockPostRepository.softDeletePostById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);

      expect(mockFilesHttpAdapter.delete).not.toHaveBeenCalled();
    });

    it('should handle file deletion error', async () => {
      // Arrange
      const command = new DeletePostCommand(mockUserId, mockPostId);
      const deleteError = new Error('Failed to delete files');

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockPostRepository.findById.mockResolvedValue(mockPost);
      mockPostRepository.softDeletePostById.mockResolvedValue(undefined);
      mockFilesHttpAdapter.delete.mockRejectedValue(deleteError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(deleteError);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
