import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import {
  UpdatePostCommandHandler,
  UpdatePostCommand,
} from '@lumio/modules/posts/application/commands/update-post.command-handler';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';
import { PostView } from '@lumio/modules/posts/api/dto/output/post.output.dto';

describe('UpdatePostCommandHandler', () => {
  let handler: UpdatePostCommandHandler;
  let mockExternalQueryUserRepository: jest.Mocked<ExternalQueryUserAccountsRepository>;
  let mockPostRepository: jest.Mocked<PostRepository>;

  const mockUserId = 1;
  const mockPostId = '100';
  const mockDescription = 'Updated post description';

  const mockUser = {
    id: mockUserId,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword',
    createdAt: new Date(),
    deletedAt: null,
    isBlocked: false,
    bannedAt: null,
    banReason: null,
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
    description: 'Original description',
    likeCount: 0,
    dislikeCount: 0,
    createdAt: new Date(),
    deletedAt: null,
    userId: mockUserId,
    user: mockUser,
    files: [],
  };

  const mockUpdatedPost: PostEntity = {
    ...mockPost,
    description: mockDescription,
  };

  const mockPostView: PostView = {
    id: mockPostId,
    description: mockDescription,
    createdAt: mockPost.createdAt,
    userId: mockUserId,
    likeCount: 0,
    dislikeCount: 0,
    userReaction: 'none',
    postFiles: [],
    newestLikes: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdatePostCommandHandler,
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
            updateDescription: jest.fn(),
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

    handler = module.get<UpdatePostCommandHandler>(UpdatePostCommandHandler);
    mockExternalQueryUserRepository = module.get(
      ExternalQueryUserAccountsRepository,
    );
    mockPostRepository = module.get(PostRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should update post successfully', async () => {
      // Arrange
      const command = new UpdatePostCommand(
        mockPostId,
        mockUserId,
        mockDescription,
      );

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockPostRepository.findById.mockResolvedValue(mockPost);
      mockPostRepository.updateDescription.mockResolvedValue(mockUpdatedPost);

      // Mock PostView.fromPrisma
      jest.spyOn(PostView, 'fromPrisma').mockReturnValue(mockPostView);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
      expect(mockPostRepository.updateDescription).toHaveBeenCalledWith(
        mockPostId,
        mockDescription,
      );
      expect(PostView.fromPrisma).toHaveBeenCalledWith(mockUpdatedPost);
      expect(result).toEqual(mockPostView);
    });

    it('should throw NotFoundDomainException when user does not exist', async () => {
      // Arrange
      const command = new UpdatePostCommand(
        mockPostId,
        mockUserId,
        mockDescription,
      );

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
        expect(error.extensions[0]?.field).toBe('userId');
      }

      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).not.toHaveBeenCalled();
      expect(mockPostRepository.updateDescription).not.toHaveBeenCalled();
    });

    it('should throw NotFoundDomainException when post does not exist', async () => {
      // Arrange
      const command = new UpdatePostCommand(
        mockPostId,
        mockUserId,
        mockDescription,
      );

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

      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
      expect(mockPostRepository.updateDescription).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenDomainException when post does not belong to user', async () => {
      // Arrange
      const command = new UpdatePostCommand(
        mockPostId,
        mockUserId,
        mockDescription,
      );
      const otherUserPost = {
        ...mockPost,
        userId: 999, // Different user
      };

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

      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
      expect(mockPostRepository.updateDescription).not.toHaveBeenCalled();
    });

    it('should throw NotFoundDomainException when post is deleted', async () => {
      // Arrange
      const command = new UpdatePostCommand(
        mockPostId,
        mockUserId,
        mockDescription,
      );
      const deletedPost = {
        ...mockPost,
        deletedAt: new Date(),
      };

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockPostRepository.findById.mockResolvedValue(deletedPost);

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

      expect(mockPostRepository.updateDescription).not.toHaveBeenCalled();
    });

    it('should handle database error when finding user', async () => {
      // Arrange
      const command = new UpdatePostCommand(
        mockPostId,
        mockUserId,
        mockDescription,
      );
      const dbError = new Error('Database connection failed');

      mockExternalQueryUserRepository.findUserId.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);

      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle database error when finding post', async () => {
      // Arrange
      const command = new UpdatePostCommand(
        mockPostId,
        mockUserId,
        mockDescription,
      );
      const dbError = new Error('Database connection failed');

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockPostRepository.findById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);

      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
      expect(mockPostRepository.updateDescription).not.toHaveBeenCalled();
    });

    it('should handle database error when updating post', async () => {
      // Arrange
      const command = new UpdatePostCommand(
        mockPostId,
        mockUserId,
        mockDescription,
      );
      const dbError = new Error('Cannot update post');

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockPostRepository.findById.mockResolvedValue(mockPost);
      mockPostRepository.updateDescription.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);

      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
      expect(mockPostRepository.updateDescription).toHaveBeenCalledWith(
        mockPostId,
        mockDescription,
      );
    });
  });
});
