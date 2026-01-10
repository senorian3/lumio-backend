import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { HttpService } from '@lumio/modules/posts/application/http.service';
import { AppLoggerService } from '@libs/logger/logger.service';
import {
  CreatePostCommandHandler,
  CreatePostCommand,
} from '@lumio/modules/posts/application/commands/create-post.command-handler';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';

describe('CreatePostCommandHandler', () => {
  let handler: CreatePostCommandHandler;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockPostRepository: jest.Mocked<PostRepository>;
  let mockHttpService: jest.Mocked<HttpService>;
  let mockLogger: jest.Mocked<AppLoggerService>;

  const mockUserId = 1;
  const mockDescription = 'Test post description';
  const mockFiles: Array<Express.Multer.File> = [
    {
      fieldname: 'files',
      originalname: 'test-image.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test-image-content'),
      size: 1024,
      destination: '/tmp',
      filename: 'test-image.jpg',
      path: '/tmp/test-image.jpg',
      stream: Readable.from(Buffer.from('test-image-content')),
    },
  ];

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
    id: 100,
    description: mockDescription,
    createdAt: new Date(),
    deletedAt: null,
    userId: mockUserId,
    user: mockUser,
    files: [],
  };

  const mockUploadedFiles: OutputFileType[] = [
    new OutputFileType(1, 'https://example.com/file1.jpg', 100),
    new OutputFileType(2, 'https://example.com/file2.jpg', 100),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePostCommandHandler,
        {
          provide: UserRepository,
          useValue: {
            findUserById: jest.fn(),
          },
        },
        {
          provide: PostRepository,
          useValue: {
            createPost: jest.fn(),
            createPostFiles: jest.fn(),
            deletePostFilesByPostId: jest.fn(),
            deletePost: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            uploadFiles: jest.fn(),
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

    handler = module.get<CreatePostCommandHandler>(CreatePostCommandHandler);
    mockUserRepository = module.get(UserRepository);
    mockPostRepository = module.get(PostRepository);
    mockHttpService = module.get(HttpService);
    mockLogger = module.get(AppLoggerService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should create post successfully with files', async () => {
      // Arrange
      const command = new CreatePostCommand(
        mockUserId,
        mockDescription,
        mockFiles,
      );

      mockUserRepository.findUserById.mockResolvedValue(mockUser);
      mockPostRepository.createPost.mockResolvedValue(mockPost);
      mockHttpService.uploadFiles.mockResolvedValue(mockUploadedFiles);
      mockPostRepository.createPostFiles.mockResolvedValue(undefined);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(mockUserId);
      expect(mockPostRepository.createPost).toHaveBeenCalledWith(
        mockUserId,
        mockDescription,
      );
      expect(mockHttpService.uploadFiles).toHaveBeenCalledWith(
        'api/v1/files/upload-post-files',
        mockPost.id,
        mockFiles,
      );
      expect(mockPostRepository.createPostFiles).toHaveBeenCalledWith(
        mockPost.id,
        mockUploadedFiles,
      );
      expect(result).toEqual({
        file: mockUploadedFiles,
        postId: mockPost.id,
      });
    });

    it('should throw BadRequestDomainException when user does not exist', async () => {
      // Arrange
      const command = new CreatePostCommand(
        mockUserId,
        mockDescription,
        mockFiles,
      );

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
        expect(error.extensions[0]?.field).toBe('userId');
      }

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(mockUserId);
      expect(mockPostRepository.createPost).not.toHaveBeenCalled();
      expect(mockHttpService.uploadFiles).not.toHaveBeenCalled();
    });

    it('should handle file upload failure and cleanup', async () => {
      // Arrange
      const command = new CreatePostCommand(
        mockUserId,
        mockDescription,
        mockFiles,
      );
      const uploadError = new Error('Upload failed');

      mockUserRepository.findUserById.mockResolvedValue(mockUser);
      mockPostRepository.createPost.mockResolvedValue(mockPost);
      mockHttpService.uploadFiles.mockRejectedValue(uploadError);
      mockPostRepository.deletePostFilesByPostId.mockResolvedValue(undefined);
      mockPostRepository.deletePost.mockResolvedValue(undefined);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );

      try {
        await handler.execute(command);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Bad Request');
        expect(error.extensions[0]?.message).toBe('Failed to upload files');
        expect(error.extensions[0]?.field).toBe('files');
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to upload files for postId=${mockPost.id}: ${uploadError.message}`,
        uploadError?.stack,
        'CommandHandler',
      );
      expect(mockPostRepository.deletePostFilesByPostId).toHaveBeenCalledWith(
        mockPost.id,
      );
      expect(mockPostRepository.deletePost).toHaveBeenCalledWith(mockPost.id);
    });

    it('should handle cleanup failure gracefully', async () => {
      // Arrange
      const command = new CreatePostCommand(
        mockUserId,
        mockDescription,
        mockFiles,
      );
      const uploadError = new Error('Upload failed');
      const cleanupError = new Error('Cleanup failed');

      mockUserRepository.findUserById.mockResolvedValue(mockUser);
      mockPostRepository.createPost.mockResolvedValue(mockPost);
      mockHttpService.uploadFiles.mockRejectedValue(uploadError);
      mockPostRepository.deletePostFilesByPostId.mockRejectedValue(
        cleanupError,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to upload files for postId=${mockPost.id}: ${uploadError.message}`,
        uploadError?.stack,
        'CommandHandler',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Cleanup failed for postId=${mockPost.id}: ${cleanupError.message}`,
        cleanupError?.stack,
        'CommandHandler',
      );
    });

    it('should handle database error when finding user', async () => {
      // Arrange
      const command = new CreatePostCommand(
        mockUserId,
        mockDescription,
        mockFiles,
      );
      const dbError = new Error('Database connection failed');

      mockUserRepository.findUserById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(mockUserId);
      expect(mockPostRepository.createPost).not.toHaveBeenCalled();
    });

    it('should handle database error when creating post', async () => {
      // Arrange
      const command = new CreatePostCommand(
        mockUserId,
        mockDescription,
        mockFiles,
      );
      const dbError = new Error('Cannot create post');

      mockUserRepository.findUserById.mockResolvedValue(mockUser);
      mockPostRepository.createPost.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(mockUserId);
      expect(mockPostRepository.createPost).toHaveBeenCalledWith(
        mockUserId,
        mockDescription,
      );
      expect(mockHttpService.uploadFiles).not.toHaveBeenCalled();
    });

    it('should handle database error when creating post files', async () => {
      // Arrange
      const command = new CreatePostCommand(
        mockUserId,
        mockDescription,
        mockFiles,
      );
      const dbError = new Error('Cannot create post files');

      mockUserRepository.findUserById.mockResolvedValue(mockUser);
      mockPostRepository.createPost.mockResolvedValue(mockPost);
      mockHttpService.uploadFiles.mockResolvedValue(mockUploadedFiles);
      mockPostRepository.createPostFiles.mockRejectedValue(dbError);
      mockPostRepository.deletePostFilesByPostId.mockResolvedValue(undefined);
      mockPostRepository.deletePost.mockResolvedValue(undefined);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to upload files for postId=${mockPost.id}: ${dbError.message}`,
        dbError?.stack,
        'CommandHandler',
      );
      expect(mockPostRepository.deletePostFilesByPostId).toHaveBeenCalledWith(
        mockPost.id,
      );
      expect(mockPostRepository.deletePost).toHaveBeenCalledWith(mockPost.id);
    });
  });
});
