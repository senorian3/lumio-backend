import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { QueryPostRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import {
  GetCreatePostQueryHandler,
  GetCreatePostUserQuery,
} from '@lumio/modules/posts/application/queries/get-by-id-create-post.query-handler';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';
import { PostView } from '@lumio/modules/posts/api/dto/output/post.output.dto';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';

describe('GetCreatePostQueryHandler', () => {
  let handler: GetCreatePostQueryHandler;
  let mockQueryPostRepository: jest.Mocked<QueryPostRepository>;

  const mockPostId = 100;
  const mockFiles: OutputFileType[] = [
    new OutputFileType(1, 'https://example.com/file1.jpg', mockPostId),
    new OutputFileType(2, 'https://example.com/file2.jpg', mockPostId),
  ];

  const mockUserProfile = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-01'),
    country: 'USA',
    city: 'NY',
    aboutMe: 'Test user',
    avatarUrl: null,
    profileFilled: false,
    profileFilledAt: null,
    profileUpdatedAt: null,
    userId: 1,
    user: {} as any,
  };

  const mockPost: PostEntity = {
    id: mockPostId,
    description: 'Test post description',
    createdAt: new Date(),
    deletedAt: null,
    userId: 1,
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashed',
      createdAt: new Date(),
      deletedAt: null,
      profile: mockUserProfile,
    },
    files: [],
  };

  const mockPostView: PostView = {
    id: mockPostId,
    description: 'Test post description',
    createdAt: mockPost.createdAt,
    userId: 1,
    postFiles: mockFiles,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCreatePostQueryHandler,
        {
          provide: QueryPostRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetCreatePostQueryHandler>(GetCreatePostQueryHandler);
    mockQueryPostRepository = module.get(QueryPostRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return post view with files successfully', async () => {
      // Arrange
      const query = new GetCreatePostUserQuery(mockPostId, mockFiles);

      mockQueryPostRepository.findById.mockResolvedValue(mockPost);

      // Mock PostView.fromEntity
      jest.spyOn(PostView, 'fromEntity').mockReturnValue(mockPostView);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockQueryPostRepository.findById).toHaveBeenCalledWith(mockPostId);
      expect(PostView.fromEntity).toHaveBeenCalledWith(mockPost, mockFiles);
      expect(result).toEqual(mockPostView);
    });

    it('should throw BadRequestDomainException when post does not exist', async () => {
      // Arrange
      const query = new GetCreatePostUserQuery(mockPostId, mockFiles);

      mockQueryPostRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        BadRequestDomainException,
      );

      try {
        await handler.execute(query);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Bad Request');
        expect(error.extensions[0]?.message).toBe('Post does not exist');
        expect(error.extensions[0]?.field).toBe('post');
      }

      expect(mockQueryPostRepository.findById).toHaveBeenCalledWith(mockPostId);
    });

    it('should handle empty files array', async () => {
      // Arrange
      const query = new GetCreatePostUserQuery(mockPostId, []);
      const emptyFilesPostView: PostView = {
        ...mockPostView,
        postFiles: [],
      };

      mockQueryPostRepository.findById.mockResolvedValue(mockPost);

      // Mock PostView.fromEntity
      jest.spyOn(PostView, 'fromEntity').mockReturnValue(emptyFilesPostView);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockQueryPostRepository.findById).toHaveBeenCalledWith(mockPostId);
      expect(PostView.fromEntity).toHaveBeenCalledWith(mockPost, []);
      expect(result.postFiles).toEqual([]);
    });

    it('should handle database error when finding post', async () => {
      // Arrange
      const query = new GetCreatePostUserQuery(mockPostId, mockFiles);
      const dbError = new Error('Database connection failed');

      mockQueryPostRepository.findById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);

      expect(mockQueryPostRepository.findById).toHaveBeenCalledWith(mockPostId);
    });

    it('should correctly pass files to PostView.fromEntity', async () => {
      // Arrange
      const customFiles: OutputFileType[] = [
        new OutputFileType(5, 'https://example.com/custom.jpg', mockPostId),
      ];
      const query = new GetCreatePostUserQuery(mockPostId, customFiles);

      mockQueryPostRepository.findById.mockResolvedValue(mockPost);

      // Mock PostView.fromEntity
      jest.spyOn(PostView, 'fromEntity').mockReturnValue(mockPostView);

      // Act
      await handler.execute(query);

      // Assert
      expect(PostView.fromEntity).toHaveBeenCalledWith(mockPost, customFiles);
    });
  });
});
