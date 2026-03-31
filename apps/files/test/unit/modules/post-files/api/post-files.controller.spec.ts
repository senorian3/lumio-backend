import { Test, TestingModule } from '@nestjs/testing';
import { PostFilesController } from '@files/modules/post-files/api/post-files.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InternalApiGuard } from '@files/core/guards/internal/internal-api.guard';
import { InputUploadFilesDto } from '@files/modules/post-files/api/dto/input/upload-files.input.dto';
import { InputGetUserPostsDto } from '@files/modules/post-files/api/dto/input/get-user-post.input.dto';
import { OutputFileType } from '@libs/dto/output/file-output';

describe('PostFilesController', () => {
  let postFilesController: PostFilesController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  const mockFiles = [
    {
      originalname: 'image1.jpg',
      mimetype: 'image/jpeg',
      size: 1024 * 1024,
      buffer: Buffer.from('test1'),
    },
    {
      originalname: 'image2.jpg',
      mimetype: 'image/jpeg',
      size: 1024 * 1024,
      buffer: Buffer.from('test2'),
    },
  ] as Express.Multer.File[];

  const mockOutputFiles: OutputFileType[] = [
    new OutputFileType(
      1,
      'https://example.com/file1.jpg',
      'post-123',
      new Date('2024-01-15T10:30:00Z'),
    ),
    new OutputFileType(
      2,
      'https://example.com/file2.jpg',
      'post-123',
      new Date('2024-01-15T10:30:00Z'),
    ),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostFilesController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(InternalApiGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    postFilesController = module.get<PostFilesController>(PostFilesController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  describe('getUserFiles', () => {
    it('should return files for a user with pagination', async () => {
      const userId = 1;
      const page = 1;
      const limit = 20;

      queryBus.execute.mockResolvedValue(mockOutputFiles);

      const result = await postFilesController.getUserFiles(
        userId,
        page,
        limit,
        'date_desc',
      );

      expect(result).toEqual(mockOutputFiles);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId, page, limit }),
      );
    });

    it('should use default pagination values', async () => {
      const userId = 1;

      queryBus.execute.mockResolvedValue(mockOutputFiles);

      const result = await postFilesController.getUserFiles(
        userId,
        1,
        50,
        'date_desc',
      );

      expect(result).toEqual(mockOutputFiles);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId, page: 1, limit: 50 }),
      );
    });
  });

  describe('getAllUserPostsFiles', () => {
    it('should return files for multiple post IDs', async () => {
      const inputDto: InputGetUserPostsDto = {
        postIds: ['post-123', 'post-456'],
      };

      queryBus.execute.mockResolvedValue(mockOutputFiles);

      const result = await postFilesController.getAllUserPostsFiles(inputDto);

      expect(result).toEqual(mockOutputFiles);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ postIds: inputDto.postIds }),
      );
    });

    it('should return empty array when no posts found', async () => {
      const inputDto: InputGetUserPostsDto = {
        postIds: ['non-existent-post'],
      };

      queryBus.execute.mockResolvedValue([]);

      const result = await postFilesController.getAllUserPostsFiles(inputDto);

      expect(result).toEqual([]);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ postIds: inputDto.postIds }),
      );
    });
  });

  describe('uploadPostFiles', () => {
    it('should upload files for post and return file info', async () => {
      const uploadDto: InputUploadFilesDto = {
        postId: 'post-123',
        userId: 1,
      };

      commandBus.execute.mockResolvedValue([]); // Mock PostFileEntity array
      queryBus.execute.mockResolvedValue(mockOutputFiles);

      const result = await postFilesController.uploadPostFiles(
        mockFiles,
        uploadDto,
      );

      expect(result).toEqual(mockOutputFiles);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: uploadDto.postId,
          files: mockFiles,
        }),
      );
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ postId: uploadDto.postId }),
      );
    });

    it('should handle empty files array', async () => {
      const uploadDto: InputUploadFilesDto = {
        postId: 'post-456',
        userId: 1,
      };
      const emptyFiles: Express.Multer.File[] = [];

      commandBus.execute.mockResolvedValue([]);
      queryBus.execute.mockResolvedValue([]);

      const result = await postFilesController.uploadPostFiles(
        emptyFiles,
        uploadDto,
      );

      expect(result).toEqual([]);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: uploadDto.postId,
          files: emptyFiles,
        }),
      );
    });
  });

  describe('deletePostFiles', () => {
    it('should delete all files for a post', async () => {
      const postId = 'post-123';

      commandBus.execute.mockResolvedValue(undefined);

      await postFilesController.deletePostFiles(postId);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ postId }),
      );
    });

    it('should handle non-existent post', async () => {
      const postId = 'non-existent-post';

      commandBus.execute.mockResolvedValue(undefined);

      await postFilesController.deletePostFiles(postId);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ postId }),
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete file by key', async () => {
      const fileKey = 'avatars/user-1/file-123.jpg';

      commandBus.execute.mockResolvedValue(undefined);

      await postFilesController.deleteFile(fileKey);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ key: fileKey }),
      );
    });

    it('should handle non-existent file key', async () => {
      const fileKey = 'non-existent-key.jpg';

      commandBus.execute.mockResolvedValue(undefined);

      await postFilesController.deleteFile(fileKey);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ key: fileKey }),
      );
    });
  });
});
