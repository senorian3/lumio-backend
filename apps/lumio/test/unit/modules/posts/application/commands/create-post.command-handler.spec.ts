import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { PostFilesRepository } from '@lumio/modules/posts/domain/infrastructure/post-files.repository';
import { FilesHttpAdapter } from '@lumio/modules/posts/application/files-http.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { PrismaService } from '@lumio/prisma/prisma.service';
import {
  CreatePostCommandHandler,
  CreatePostCommand,
} from '@lumio/modules/posts/application/commands/create-post.command-handler';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';
import { OutputFileType } from '@libs/dto/output/file-output';

describe('CreatePostCommandHandler', () => {
  let handler: CreatePostCommandHandler;
  let mockExternalQueryUserRepository: jest.Mocked<ExternalQueryUserAccountsRepository>;
  let mockPostRepository: jest.Mocked<PostRepository>;
  let mockPostFilesRepository: jest.Mocked<PostFilesRepository>;
  let mockFilesHttpAdapter: jest.Mocked<FilesHttpAdapter>;
  let mockPrisma: jest.Mocked<PrismaService>;

  const mockUserId = 1;
  const mockDescription = 'Test post description';
  const mockPostId = '100';
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
    description: mockDescription,
    createdAt: new Date(),
    deletedAt: null,
    userId: mockUserId,
    user: mockUser,
    files: [],
  };

  const mockUploadedFiles: OutputFileType[] = [
    new OutputFileType(1, 'https://example.com/file1.jpg', '100'),
    new OutputFileType(2, 'https://example.com/file2.jpg', '100'),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePostCommandHandler,
        {
          provide: ExternalQueryUserAccountsRepository,
          useValue: {
            findUserId: jest.fn(),
          },
        },
        {
          provide: PostRepository,
          useValue: {
            createPost: jest.fn(),
          },
        },
        {
          provide: PostFilesRepository,
          useValue: {
            createPostFiles: jest.fn(),
            deletePostFilesByPostId: jest.fn(),
          },
        },
        {
          provide: FilesHttpAdapter,
          useValue: {
            uploadFiles: jest.fn(),
            deletePostFiles: jest.fn(),
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<CreatePostCommandHandler>(CreatePostCommandHandler);
    mockExternalQueryUserRepository = module.get(
      ExternalQueryUserAccountsRepository,
    );
    mockPostRepository = module.get(PostRepository);
    mockPostFilesRepository = module.get(PostFilesRepository);
    mockFilesHttpAdapter = module.get(FilesHttpAdapter);
    mockPrisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should create post successfully with files', async () => {
      const command = new CreatePostCommand(
        mockUserId,
        mockDescription,
        mockFiles,
      );

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockFilesHttpAdapter.uploadFiles.mockResolvedValue(mockUploadedFiles);
      mockPostRepository.createPost.mockResolvedValue(mockPost);
      mockPostFilesRepository.createPostFiles.mockResolvedValue(undefined);
      mockPrisma.$transaction.mockImplementation(async () => {
        await mockPostRepository.createPost(
          command.userId,
          expect.any(String),
          command.description,
          {},
        );
        await mockPostFilesRepository.createPostFiles(
          expect.any(String),
          mockUploadedFiles,
          {},
        );
        return undefined;
      });

      const result = await handler.execute(command);

      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.createPost).toHaveBeenCalled();
      expect(mockFilesHttpAdapter.uploadFiles).toHaveBeenCalled();
      expect(mockPostFilesRepository.createPostFiles).toHaveBeenCalled();
      expect(result).toEqual({
        files: mockUploadedFiles,
        postId: expect.any(String),
      });
    });

    it('should throw NotFoundDomainException when user does not exist', async () => {
      const command = new CreatePostCommand(
        mockUserId,
        mockDescription,
        mockFiles,
      );

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundDomainException,
      );

      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.createPost).not.toHaveBeenCalled();
      expect(mockFilesHttpAdapter.uploadFiles).not.toHaveBeenCalled();
    });

    it('should throw error when file upload fails', async () => {
      const command = new CreatePostCommand(
        mockUserId,
        mockDescription,
        mockFiles,
      );
      const uploadError = new Error('Upload failed');

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockFilesHttpAdapter.uploadFiles.mockRejectedValue(uploadError);

      await expect(handler.execute(command)).rejects.toThrow(uploadError);
    });

    it('should handle database error when finding user', async () => {
      const command = new CreatePostCommand(
        mockUserId,
        mockDescription,
        mockFiles,
      );
      const dbError = new Error('Database connection failed');

      mockExternalQueryUserRepository.findUserId.mockRejectedValue(dbError);

      await expect(handler.execute(command)).rejects.toThrow(dbError);

      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockPostRepository.createPost).not.toHaveBeenCalled();
    });

    it('should throw error when database error occurs', async () => {
      const command = new CreatePostCommand(
        mockUserId,
        mockDescription,
        mockFiles,
      );
      const dbError = new Error('Cannot create post');

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockFilesHttpAdapter.uploadFiles.mockResolvedValue(mockUploadedFiles);
      mockPrisma.$transaction.mockRejectedValue(dbError);

      await expect(handler.execute(command)).rejects.toThrow(dbError);

      expect(mockFilesHttpAdapter.deletePostFiles).toHaveBeenCalled();
    });
  });
});
