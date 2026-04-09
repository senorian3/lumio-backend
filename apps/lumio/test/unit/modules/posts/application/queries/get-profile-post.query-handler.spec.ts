import { Test, TestingModule } from '@nestjs/testing';
import { QueryPostRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import {
  GetProfilePostQueryHandler,
  GetProfilePostQuery,
} from '@lumio/modules/posts/application/queries/get-profile-post.query-handler';
import { PostView } from '@lumio/modules/posts/api/dto/output/post.output.dto';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';

describe('GetProfilePostQueryHandler', () => {
  let handler: GetProfilePostQueryHandler;
  let mockPostRepository: jest.Mocked<QueryPostRepository>;
  let mockExternalQueryUserRepository: jest.Mocked<ExternalQueryUserAccountsRepository>;

  const mockUserId = 1;
  const mockPostId = '100';

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

  const mockPostFromDb = {
    id: mockPostId,
    description: 'Test post description',
    likeCount: 0,
    dislikeCount: 0,
    createdAt: new Date(),
    deletedAt: null,
    userId: mockUserId,
    user: mockUser,
    files: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProfilePostQueryHandler,
        {
          provide: QueryPostRepository,
          useValue: {
            findById: jest.fn(),
            findUserReactionToPost: jest.fn().mockResolvedValue(null),
            findNewestLikesForPost: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: ExternalQueryUserAccountsRepository,
          useValue: {
            findUserId: jest.fn(),
            getProfileById: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetProfilePostQueryHandler>(
      GetProfilePostQueryHandler,
    );
    mockPostRepository = module.get(QueryPostRepository);
    mockExternalQueryUserRepository = module.get(
      ExternalQueryUserAccountsRepository,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return post view when user and post exist and post belongs to user', async () => {
      // Arrange
      const query = new GetProfilePostQuery(mockUserId, mockPostId, null);

      mockExternalQueryUserRepository.getProfileById.mockResolvedValue({
        userId: mockUserId,
      } as any);
      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockPostRepository.findById.mockResolvedValue(mockPostFromDb);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(
        mockExternalQueryUserRepository.getProfileById,
      ).toHaveBeenCalledWith(mockUserId);
      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
      expect(result).toBeInstanceOf(PostView);
      expect(result.id).toBe(mockPostId);
      expect(result.description).toBe('Test post description');
      expect(result.userId).toBe(mockUserId);
    });

    it('should throw NotFoundDomainException when user does not exist', async () => {
      // Arrange
      const query = new GetProfilePostQuery(mockUserId, mockPostId, null);

      mockExternalQueryUserRepository.getProfileById.mockResolvedValue(null);

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
        expect(error.extensions[0]?.field).toBe('profileId');
      }

      expect(
        mockExternalQueryUserRepository.getProfileById,
      ).toHaveBeenCalledWith(mockUserId);
      expect(mockPostRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundDomainException when postId is not provided', async () => {
      // Arrange
      const query = new GetProfilePostQuery(mockUserId, null, null);

      mockExternalQueryUserRepository.getProfileById.mockResolvedValue({
        userId: mockUserId,
      } as any);
      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);

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

      expect(
        mockExternalQueryUserRepository.getProfileById,
      ).toHaveBeenCalledWith(mockUserId);
      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundDomainException when post does not exist', async () => {
      // Arrange
      const query = new GetProfilePostQuery(mockUserId, mockPostId, null);

      mockExternalQueryUserRepository.getProfileById.mockResolvedValue({
        userId: mockUserId,
      } as any);
      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
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

      expect(
        mockExternalQueryUserRepository.getProfileById,
      ).toHaveBeenCalledWith(mockUserId);
      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
    });

    it('should throw NotFoundDomainException when post does not belong to user', async () => {
      // Arrange
      const query = new GetProfilePostQuery(mockUserId, mockPostId, null);
      const otherUserPost = {
        ...mockPostFromDb,
        userId: 999,
        user: { ...mockUser, id: 999 },
      };

      mockExternalQueryUserRepository.getProfileById.mockResolvedValue({
        userId: mockUserId,
      } as any);
      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
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

      expect(
        mockExternalQueryUserRepository.getProfileById,
      ).toHaveBeenCalledWith(mockUserId);
      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
    });

    it('should handle database error when finding user', async () => {
      // Arrange
      const query = new GetProfilePostQuery(mockUserId, mockPostId, null);
      const dbError = new Error('Database connection failed');

      mockExternalQueryUserRepository.getProfileById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);

      expect(
        mockExternalQueryUserRepository.getProfileById,
      ).toHaveBeenCalledWith(mockUserId);
      expect(mockPostRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle database error when finding post', async () => {
      // Arrange
      const query = new GetProfilePostQuery(mockUserId, mockPostId, null);
      const dbError = new Error('Database connection failed');

      mockExternalQueryUserRepository.getProfileById.mockResolvedValue({
        userId: mockUserId,
      } as any);
      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockPostRepository.findById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);

      expect(
        mockExternalQueryUserRepository.getProfileById,
      ).toHaveBeenCalledWith(mockUserId);
      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.findById).toHaveBeenCalledWith(mockPostId);
    });
  });
});
