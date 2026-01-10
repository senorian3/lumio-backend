import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { HttpService } from '@lumio/modules/posts/application/http.service';
import { AppLoggerService } from '@libs/logger/logger.service';
import {
  DeletePostCommandHandler,
  DeletePostCommand,
} from '@lumio/modules/posts/application/commands/delete-post.command-handler';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';

describe('DeletePostCommandHandler', () => {
  let handler: DeletePostCommandHandler;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockPostRepository: jest.Mocked<PostRepository>;
  let mockHttpService: jest.Mocked<HttpService>;
  let mockLogger: jest.Mocked<AppLoggerService>;

  const mockUserId = 1;
  const mockPostId = 100;

  const mockUser = {
    id: mockUserId,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword',
    createdAt: new Date(),
    deletedAt: null,
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-01'),
    country: 'USA',
    city: 'New York',
    aboutMe: 'Test user',
    avatarUrl: null,
    profileFilled: false,
    profileFilledAt: null,
    profileUpdatedAt: null,
  };

  const mockPost: PostEntity = {
    id: mockPostId,
    description: 'Test post description',
    createdAt: new Date(),
    deletedAt: null,
    userId: mockUserId,
    user: mockUser,
    files: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletePostCommandHandler,
        {
          provide: UserRepository,
          useValue: {
            findUserById: jest.fn(),
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
          provide: HttpService,
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
    mockUserRepository = module.get(UserRepository);
    mockPostRepository = module.get(PostRepository);
    mockHttpService = module.get(HttpService);
    mockLogger = module.get(AppLoggerService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should delete post successfully', async () => {
      // Arrange
      const command = new DeletePostCommand(mockUserId, mockPostId);

      mockUserRepository.findUserById.mockResolvedValue(mockUser);
      mockPostRepository.findById.mockResolvedValue(mockPost);
      mockPostRepository.softDeletePostById.mockResolvedValue(undefined);
      mockHttpService.delete.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(mockUserId);
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
      expect(mockPostRepository.softDeletePostById).toHaveBeenCalledWith(
        mockPostId,
      );
      expect(mockHttpService.delete).toHaveBeenCalledWith(
        'api/v1/files/delete-post-files/100',
      );
    });

    it('should throw BadRequestDomainException when user does not exist', async () => {
      // Arrange
      const command = new DeletePostCommand(mockUserId, mockPostId);

      mockUserRepository.findUserById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );

      try {
        await handler.execute(command);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Bad Request');
        expect(error.extensions[0]?.message).toBe('User does not exist');
        expect(error.extensions[0]?.field).toBe('user');
      }

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(mockUserId);
      expect(mockPostRepository.findById).not.toHaveBeenCalled();
      expect(mockPostRepository.softDeletePostById).not.toHaveBeenCalled();
      expect(mockHttpService.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundDomainException when post does not exist', async () => {
      // Arrange
      const command = new DeletePostCommand(mockUserId, mockPostId);

      mockUserRepository.findUserById.mockResolvedValue(mockUser);
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

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(mockUserId);
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
      expect(mockPostRepository.softDeletePostById).not.toHaveBeenCalled();
      expect(mockHttpService.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenDomainException when post does not belong to user', async () => {
      // Arrange
      const command = new DeletePostCommand(mockUserId, mockPostId);
      const otherUserPost = {
        ...mockPost,
        userId: 999, // Different user
      };

      mockUserRepository.findUserById.mockResolvedValue(mockUser);
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

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(mockUserId);
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
      expect(mockPostRepository.softDeletePostById).not.toHaveBeenCalled();
      expect(mockHttpService.delete).not.toHaveBeenCalled();
    });

    it('should handle file deletion failure', async () => {
      // Arrange
      const command = new DeletePostCommand(mockUserId, mockPostId);
      const deleteError = new Error('File deletion failed');

      mockUserRepository.findUserById.mockResolvedValue(mockUser);
      mockPostRepository.findById.mockResolvedValue(mockPost);
      mockPostRepository.softDeletePostById.mockResolvedValue(undefined);
      mockHttpService.delete.mockRejectedValue(deleteError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );

      try {
        await handler.execute(command);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Bad Request');
        expect(error.extensions[0]?.message).toBe('Failed to delete files');
        expect(error.extensions[0]?.field).toBe('files');
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to delete files for postId=${mockPostId}: ${deleteError.message}`,
        deleteError?.stack,
        'CommandHandler',
      );
    });

    it('should handle database error when finding user', async () => {
      // Arrange
      const command = new DeletePostCommand(mockUserId, mockPostId);
      const dbError = new Error('Database connection failed');

      mockUserRepository.findUserById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(mockUserId);
      expect(mockPostRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle database error when finding post', async () => {
      // Arrange
      const command = new DeletePostCommand(mockUserId, mockPostId);
      const dbError = new Error('Database connection failed');

      mockUserRepository.findUserById.mockResolvedValue(mockUser);
      mockPostRepository.findById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(mockUserId);
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
      expect(mockPostRepository.softDeletePostById).not.toHaveBeenCalled();
    });

    it('should handle database error when deleting post', async () => {
      // Arrange
      const command = new DeletePostCommand(mockUserId, mockPostId);
      const dbError = new Error('Cannot delete post');

      mockUserRepository.findUserById.mockResolvedValue(mockUser);
      mockPostRepository.findById.mockResolvedValue(mockPost);
      mockPostRepository.softDeletePostById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(mockUserId);
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
      expect(mockPostRepository.softDeletePostById).toHaveBeenCalledWith(
        mockPostId,
      );
      expect(mockHttpService.delete).not.toHaveBeenCalled();
    });
  });
});
