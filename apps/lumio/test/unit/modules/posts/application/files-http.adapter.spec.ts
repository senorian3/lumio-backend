import { Test, TestingModule } from '@nestjs/testing';
import { FilesHttpAdapter } from '@lumio/modules/posts/application/files-http.adapter';
import { CoreConfig } from '@lumio/core/core.config';
import axios from 'axios';

jest.mock('axios');

describe('FilesHttpAdapter', () => {
  let adapter: FilesHttpAdapter;
  const mockAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesHttpAdapter,
        {
          provide: CoreConfig,
          useValue: {
            filesFrontendUrl: 'http://files-service:3000',
            internalApiKey: 'test-api-key',
          },
        },
      ],
    }).compile();

    adapter = module.get<FilesHttpAdapter>(FilesHttpAdapter);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('delete', () => {
    it('should send DELETE request with correct headers', async () => {
      const mockResponse = { data: { success: true } };
      mockAxios.delete.mockResolvedValue(mockResponse);

      const result = await adapter.delete('files/delete-file/key123');

      expect(mockAxios.delete).toHaveBeenCalledWith(
        'http://files-service:3000/files/delete-file/key123',
        {
          headers: expect.objectContaining({
            'X-Internal-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          }),
        },
      );
      expect(result).toEqual({ success: true });
    });

    it('should pass additional headers', async () => {
      mockAxios.delete.mockResolvedValue({ data: {} });

      await adapter.delete('endpoint', { 'X-Custom': 'value' });

      expect(mockAxios.delete).toHaveBeenCalledWith(expect.any(String), {
        headers: expect.objectContaining({
          'X-Custom': 'value',
        }),
      });
    });

    it('should throw error when request fails', async () => {
      mockAxios.delete.mockRejectedValue(new Error('Network error'));

      await expect(adapter.delete('endpoint')).rejects.toThrow('Network error');
    });
  });

  describe('uploadFiles', () => {
    it('should send POST request with FormData', async () => {
      const mockResponse = { data: { files: [] } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const mockFiles = [
        {
          buffer: Buffer.from('file1'),
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
        },
      ] as Express.Multer.File[];

      const result = await adapter.uploadFiles(
        'files/upload',
        'post_123',
        mockFiles,
      );

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://files-service:3000/files/upload',
        expect.any(Object),
        {
          headers: expect.objectContaining({
            'X-Internal-API-Key': 'test-api-key',
          }),
        },
      );
      expect(result).toEqual({ files: [] });
    });

    it('should throw error when upload fails', async () => {
      mockAxios.post.mockRejectedValue(new Error('Upload error'));

      await expect(
        adapter.uploadFiles('endpoint', 'post_123', []),
      ).rejects.toThrow('Upload error');
    });
  });

  describe('uploadUserAvatar', () => {
    it('should send POST request with avatar FormData', async () => {
      const mockResponse = { data: { avatarUrl: 'url' } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const mockAvatar = {
        buffer: Buffer.from('avatar'),
        originalname: 'avatar.png',
        mimetype: 'image/png',
      } as Express.Multer.File;

      const result = await adapter.uploadUserAvatar(
        'profile/upload-avatar',
        1,
        mockAvatar,
      );

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://files-service:3000/profile/upload-avatar',
        expect.any(Object),
        {
          headers: expect.objectContaining({
            'X-Internal-API-Key': 'test-api-key',
          }),
        },
      );
      expect(result).toEqual({ avatarUrl: 'url' });
    });

    it('should throw error when avatar upload fails', async () => {
      mockAxios.post.mockRejectedValue(new Error('Avatar upload error'));

      const mockAvatar = {
        buffer: Buffer.from('avatar'),
        originalname: 'avatar.png',
        mimetype: 'image/png',
      } as Express.Multer.File;

      await expect(
        adapter.uploadUserAvatar('endpoint', 1, mockAvatar),
      ).rejects.toThrow('Avatar upload error');
    });
  });

  describe('deleteUserAvatar', () => {
    it('should send DELETE request for user avatar', async () => {
      mockAxios.delete.mockResolvedValue({ data: { success: true } });

      const result = await adapter.deleteUserAvatar(1);

      expect(mockAxios.delete).toHaveBeenCalledWith(
        'http://files-service:3000/profile/delete-user-avatar/1',
        {
          headers: expect.objectContaining({
            'X-Internal-API-Key': 'test-api-key',
          }),
        },
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw error when delete avatar fails', async () => {
      mockAxios.delete.mockRejectedValue(new Error('Delete error'));

      await expect(adapter.deleteUserAvatar(1)).rejects.toThrow('Delete error');
    });
  });

  describe('deleteFile', () => {
    it('should send DELETE request for file by key', async () => {
      mockAxios.delete.mockResolvedValue({ data: { deleted: true } });

      const result = await adapter.deleteFile('file-key-123');

      expect(mockAxios.delete).toHaveBeenCalledWith(
        'http://files-service:3000/files/delete-file/file-key-123',
        expect.any(Object),
      );
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('deletePostFiles', () => {
    it('should send DELETE request for all post files', async () => {
      mockAxios.delete.mockResolvedValue({ data: { count: 3 } });

      const result = await adapter.deletePostFiles('post_456');

      expect(mockAxios.delete).toHaveBeenCalledWith(
        'http://files-service:3000/files/delete-post-files/post_456',
        expect.any(Object),
      );
      expect(result).toEqual({ count: 3 });
    });
  });
});
