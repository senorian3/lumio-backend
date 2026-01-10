import { Test, TestingModule } from '@nestjs/testing';
import {
  GetProfileOrPostQueryHandler,
  GetProfileOrPostQuery,
} from '@lumio/modules/user-accounts/profile/application/queries/get-profile-or-post.query-handler';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { ProfileView } from '@lumio/modules/user-accounts/profile/api/dto/output/profile.output.dto';
import { PostView } from '@lumio/modules/posts/api/dto/output/post.output.dto';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';

describe('GetProfileOrPostQueryHandler', () => {
  let handler: GetProfileOrPostQueryHandler;
  let mockUserRepository: UserRepository;
  let mockPostRepository: PostRepository;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-01'),
    country: 'USA',
    city: 'New York',
    aboutMe: 'About me',
    avatarUrl: 'avatar.jpg',
    password: 'hashedpassword',
    createdAt: new Date(),
    deletedAt: null,
    profileFilled: false,
    profileFilledAt: null,
    profileUpdatedAt: null,
  };

  const mockPost = {
    id: 1,
    description: 'Test post',
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    files: [],
  };

  const mockProfileView = ProfileView.fromEntity(mockUser);
  const mockPostView = PostView.fromPrisma(mockPost);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProfileOrPostQueryHandler,
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
          },
        },
      ],
    }).compile();

    handler = module.get<GetProfileOrPostQueryHandler>(
      GetProfileOrPostQueryHandler,
    );
    mockUserRepository = module.get<UserRepository>(UserRepository);
    mockPostRepository = module.get<PostRepository>(PostRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return profile view when no postId provided', async () => {
      // Arrange
      const userId = 1;
      const query = new GetProfileOrPostQuery(userId);

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(
        mockUser,
      );
      jest.spyOn(ProfileView, 'fromEntity').mockReturnValue(mockProfileView);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockPostRepository.findById).not.toHaveBeenCalled();
      expect(ProfileView.fromEntity).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockProfileView);
    });

    it('should return post view when postId is provided', async () => {
      // Arrange
      const userId = 1;
      const postId = 1;
      const query = new GetProfileOrPostQuery(userId, postId);

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (mockPostRepository.findById as jest.Mock).mockResolvedValue(mockPost);
      jest.spyOn(PostView, 'fromPrisma').mockReturnValue(mockPostView);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockPostRepository.findById).toHaveBeenCalledWith(postId);
      expect(PostView.fromPrisma).toHaveBeenCalledWith(mockPost);
      expect(result).toEqual(mockPostView);
    });

    it('should throw NotFoundDomainException when user not found', async () => {
      // Arrange
      const userId = 999;
      const query = new GetProfileOrPostQuery(userId);

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        NotFoundDomainException,
      );
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockPostRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundDomainException when post not found', async () => {
      // Arrange
      const userId = 1;
      const postId = 999;
      const query = new GetProfileOrPostQuery(userId, postId);

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (mockPostRepository.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        NotFoundDomainException,
      );
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockPostRepository.findById).toHaveBeenCalledWith(postId);
    });

    it('should handle repository findUserById error', async () => {
      // Arrange
      const userId = 1;
      const query = new GetProfileOrPostQuery(userId);
      const dbError = new Error('Database connection failed');

      (mockUserRepository.findUserById as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockPostRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle repository findById error when postId provided', async () => {
      // Arrange
      const userId = 1;
      const postId = 1;
      const query = new GetProfileOrPostQuery(userId, postId);
      const dbError = new Error('Database connection failed');

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (mockPostRepository.findById as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockPostRepository.findById).toHaveBeenCalledWith(postId);
    });

    it('should handle undefined postId (same as no postId)', async () => {
      // Arrange
      const userId = 1;
      const query = new GetProfileOrPostQuery(userId, undefined);

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(
        mockUser,
      );
      jest.spyOn(ProfileView, 'fromEntity').mockReturnValue(mockProfileView);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockPostRepository.findById).not.toHaveBeenCalled();
      expect(ProfileView.fromEntity).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockProfileView);
    });

    it('should handle null postId (same as no postId)', async () => {
      // Arrange
      const userId = 1;
      const query = new GetProfileOrPostQuery(userId, null);

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(
        mockUser,
      );
      jest.spyOn(ProfileView, 'fromEntity').mockReturnValue(mockProfileView);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockPostRepository.findById).not.toHaveBeenCalled();
      expect(ProfileView.fromEntity).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockProfileView);
    });
  });
});
