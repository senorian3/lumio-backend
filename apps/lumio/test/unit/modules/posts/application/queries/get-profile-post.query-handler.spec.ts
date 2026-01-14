import { Test, TestingModule } from '@nestjs/testing';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { ExternalQueryUserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import {
  GetProfilePostQueryHandler,
  GetProfilePostQuery,
} from '@lumio/modules/posts/application/queries/get-profile-post.query-handler';
import { PostView } from '@lumio/modules/posts/api/dto/output/post.output.dto';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';

describe('GetProfilePostQueryHandler', () => {
  let handler: GetProfilePostQueryHandler;
  let mockPostRepository: jest.Mocked<PostRepository>;
  let mockExternalQueryUserRepository: jest.Mocked<ExternalQueryUserRepository>;

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

  const mockPostFromDb = {
    id: mockPostId,
    description: 'Test post description',
    createdAt: new Date(),
    deletedAt: null,
    userId: mockUserId,
    user: mockUser,
    files: [],
  };

  const mockPostView: PostView = {
    id: mockPostId,
    description: 'Test post description',
    createdAt: mockPostFromDb.createdAt,
    userId: mockUserId,
    postFiles: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProfilePostQueryHandler,
        {
          provide: PostRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: ExternalQueryUserRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetProfilePostQueryHandler>(
      GetProfilePostQueryHandler,
    );
    mockPostRepository = module.get(PostRepository);
    mockExternalQueryUserRepository = module.get(ExternalQueryUserRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return post view when user and post exist and post belongs to user', async () => {
      // Arrange
      const query = new GetProfilePostQuery(mockUserId, mockPostId);

      mockExternalQueryUserRepository.findById.mockResolvedValue(mockUserId);
      mockPostRepository.findById.mockResolvedValue(mockPostFromDb);

      // Mock PostView.fromPrisma
      jest.spyOn(PostView, 'fromPrisma').mockReturnValue(mockPostView);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockExternalQueryUserRepository.findById).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
      expect(PostView.fromPrisma).toHaveBeenCalledWith(mockPostFromDb);
      expect(result).toEqual(mockPostView);
    });

    it('should throw NotFoundDomainException when user does not exist', async () => {
      // Arrange
      const query = new GetProfilePostQuery(mockUserId, mockPostId);

      mockExternalQueryUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        NotFoundDomainException,
      );

      try {
        await handler.execute(query);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Not Found');
        expect(error.extensions[0]?.message).toBe('Profile is not found');
        expect(error.extensions[0]?.field).toBe('userId');
      }

      expect(mockExternalQueryUserRepository.findById).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundDomainException when postId is not provided', async () => {
      // Arrange
      const query = new GetProfilePostQuery(mockUserId, null);

      mockExternalQueryUserRepository.findById.mockResolvedValue(mockUserId);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        NotFoundDomainException,
      );

      try {
        await handler.execute(query);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Not Found');
        expect(error.extensions[0]?.message).toBe('Post is not found');
        expect(error.extensions[0]?.field).toBe('postId');
      }

      expect(mockExternalQueryUserRepository.findById).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundDomainException when post does not exist', async () => {
      // Arrange
      const query = new GetProfilePostQuery(mockUserId, mockPostId);

      mockExternalQueryUserRepository.findById.mockResolvedValue(mockUserId);
      mockPostRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        NotFoundDomainException,
      );

      try {
        await handler.execute(query);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Not Found');
        expect(error.extensions[0]?.message).toBe('Post is not found');
        expect(error.extensions[0]?.field).toBe('postId');
      }

      expect(mockExternalQueryUserRepository.findById).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
    });

    it('should throw NotFoundDomainException when post does not belong to user', async () => {
      // Arrange
      const query = new GetProfilePostQuery(mockUserId, mockPostId);
      const otherUserPost = {
        ...mockPostFromDb,
        userId: 999, // Different user
        user: { ...mockUser, id: 999 }, // Different user
      };

      mockExternalQueryUserRepository.findById.mockResolvedValue(mockUserId);
      mockPostRepository.findById.mockResolvedValue(otherUserPost);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        NotFoundDomainException,
      );

      try {
        await handler.execute(query);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Not Found');
        expect(error.extensions[0]?.message).toBe('Post is not found');
        expect(error.extensions[0]?.field).toBe('postId');
      }

      expect(mockExternalQueryUserRepository.findById).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
    });

    it('should handle database error when finding user', async () => {
      // Arrange
      const query = new GetProfilePostQuery(mockUserId, mockPostId);
      const dbError = new Error('Database connection failed');

      mockExternalQueryUserRepository.findById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);

      expect(mockExternalQueryUserRepository.findById).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle database error when finding post', async () => {
      // Arrange
      const query = new GetProfilePostQuery(mockUserId, mockPostId);
      const dbError = new Error('Database connection failed');

      mockExternalQueryUserRepository.findById.mockResolvedValue(mockUserId);
      mockPostRepository.findById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);

      expect(mockExternalQueryUserRepository.findById).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
    });
  });
});
