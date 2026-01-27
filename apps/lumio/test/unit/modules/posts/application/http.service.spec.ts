import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import axios from 'axios';
import { HttpService } from '@libs/shared/files-http.adapter';
import { CoreConfig } from '@lumio/core/core.config';
import { AppLoggerService } from '@libs/logger/logger.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HttpService', () => {
  let service: HttpService;
  let mockLoggerService: jest.Mocked<AppLoggerService>;

  const mockFilesFrontendUrl = 'http://files-service:3000';
  const mockInternalApiKey = 'test-api-key';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpService,
        {
          provide: CoreConfig,
          useValue: {
            filesFrontendUrl: mockFilesFrontendUrl,
            internalApiKey: mockInternalApiKey,
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

    service = module.get<HttpService>(HttpService);
    mockLoggerService = module.get(AppLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('post', () => {
    it('should make a successful POST request', async () => {
      // Arrange
      const endpoint = 'test-endpoint';
      const data = { key: 'value' };
      const additionalHeaders = { 'Custom-Header': 'custom-value' };
      const expectedResponse = { success: true };
      const mockResponse = { data: expectedResponse };

      mockedAxios.post.mockResolvedValue(mockResponse);

      // Act
      const result = await service.post(endpoint, data, additionalHeaders);

      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${mockFilesFrontendUrl}/${endpoint}`,
        data,
        {
          headers: {
            'X-Internal-API-Key': mockInternalApiKey,
            'Content-Type': 'application/json',
            ...additionalHeaders,
          },
        },
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should make POST request without data', async () => {
      // Arrange
      const endpoint = 'test-endpoint';
      const expectedResponse = { success: true };
      const mockResponse = { data: expectedResponse };

      mockedAxios.post.mockResolvedValue(mockResponse);

      // Act
      const result = await service.post(endpoint);

      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${mockFilesFrontendUrl}/${endpoint}`,
        undefined,
        {
          headers: {
            'X-Internal-API-Key': mockInternalApiKey,
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle POST request error', async () => {
      // Arrange
      const endpoint = 'test-endpoint';
      const data = { key: 'value' };
      const axiosError = new Error('Network error');
      axiosError.stack = 'Error stack';

      mockedAxios.post.mockRejectedValue(axiosError);

      // Act & Assert
      await expect(service.post(endpoint, data)).rejects.toThrow(axiosError);

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        `Failed to POST to ${mockFilesFrontendUrl}/${endpoint}:`,
        axiosError.stack,
        'HttpService',
      );
    });
  });

  describe('delete', () => {
    it('should make a successful DELETE request', async () => {
      // Arrange
      const endpoint = 'test-endpoint';
      const additionalHeaders = { 'Custom-Header': 'custom-value' };
      const expectedResponse = { deleted: true };
      const mockResponse = { data: expectedResponse };

      mockedAxios.delete.mockResolvedValue(mockResponse);

      // Act
      const result = await service.delete(endpoint, additionalHeaders);

      // Assert
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `${mockFilesFrontendUrl}/${endpoint}`,
        {
          headers: {
            'X-Internal-API-Key': mockInternalApiKey,
            'Content-Type': 'application/json',
            ...additionalHeaders,
          },
        },
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should make DELETE request without additional headers', async () => {
      // Arrange
      const endpoint = 'test-endpoint';
      const expectedResponse = { deleted: true };
      const mockResponse = { data: expectedResponse };

      mockedAxios.delete.mockResolvedValue(mockResponse);

      // Act
      const result = await service.delete(endpoint);

      // Assert
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `${mockFilesFrontendUrl}/${endpoint}`,
        {
          headers: {
            'X-Internal-API-Key': mockInternalApiKey,
            'Content-Type': 'application/json',
          },
        },
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle DELETE request error', async () => {
      // Arrange
      const endpoint = 'test-endpoint';
      const axiosError = new Error('Network error');
      axiosError.stack = 'Error stack';

      mockedAxios.delete.mockRejectedValue(axiosError);

      // Act & Assert
      await expect(service.delete(endpoint)).rejects.toThrow(axiosError);

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        `Failed to DELETE from ${mockFilesFrontendUrl}/${endpoint}:`,
        axiosError.stack,
        'HttpService',
      );
    });
  });

  describe('uploadFiles', () => {
    it('should upload files successfully', async () => {
      // Arrange
      const endpoint = 'upload-endpoint';
      const postId = 123;
      const mockFiles: Array<Express.Multer.File> = [
        {
          buffer: Buffer.from('file1 content'),
          originalname: 'file1.jpg',
          mimetype: 'image/jpeg',
          fieldname: 'files',
          encoding: '7bit',
          size: 1024,
          destination: '/tmp',
          filename: 'file1.jpg',
          path: '/tmp/file1.jpg',
          stream: Readable.from(Buffer.from('file1 content')),
        },
        {
          buffer: Buffer.from('file2 content'),
          originalname: 'file2.png',
          mimetype: 'image/png',
          fieldname: 'files',
          encoding: '7bit',
          size: 1024,
          destination: '/tmp',
          filename: 'file2.png',
          path: '/tmp/file2.png',
          stream: Readable.from(Buffer.from('file2 content')),
        },
      ];
      const expectedResponse = { uploaded: true };
      const mockResponse = { data: expectedResponse };

      mockedAxios.post.mockResolvedValue(mockResponse);

      // Act
      const result = await service.uploadFiles(endpoint, postId, mockFiles);

      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${mockFilesFrontendUrl}/${endpoint}`,
        expect.anything(), // FormData instance
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Internal-API-Key': mockInternalApiKey,
          }),
        }),
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle upload with empty files array', async () => {
      // Arrange
      const endpoint = 'upload-endpoint';
      const postId = 123;
      const mockFiles: Array<Express.Multer.File> = [];
      const expectedResponse = { uploaded: true };
      const mockResponse = { data: expectedResponse };

      mockedAxios.post.mockResolvedValue(mockResponse);

      // Act
      const result = await service.uploadFiles(endpoint, postId, mockFiles);

      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${mockFilesFrontendUrl}/${endpoint}`,
        expect.anything(), // FormData instance
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Internal-API-Key': mockInternalApiKey,
          }),
        }),
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle upload error', async () => {
      // Arrange
      const endpoint = 'upload-endpoint';
      const postId = 123;
      const mockFiles: Array<Express.Multer.File> = [
        {
          buffer: Buffer.from('file content'),
          originalname: 'file.jpg',
          mimetype: 'image/jpeg',
          fieldname: 'files',
          encoding: '7bit',
          size: 1024,
          destination: '/tmp',
          filename: 'file.jpg',
          path: '/tmp/file.jpg',
          stream: Readable.from(Buffer.from('file content')),
        },
      ];
      const axiosError = new Error('Upload failed');
      axiosError.stack = 'Error stack';

      mockedAxios.post.mockRejectedValue(axiosError);

      // Act & Assert
      await expect(
        service.uploadFiles(endpoint, postId, mockFiles),
      ).rejects.toThrow(axiosError);

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        `Failed to POST to ${mockFilesFrontendUrl}/${endpoint}:`,
        axiosError.stack,
        'HttpService',
      );
    });
  });
});
