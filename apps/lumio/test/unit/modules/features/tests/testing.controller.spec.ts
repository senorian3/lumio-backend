import { Test, TestingModule } from '@nestjs/testing';
import { TestingController } from '@lumio/modules/features/tests/testing.controller';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { CoreConfig } from '@lumio/core/core.config';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TestingController', () => {
  let testingController: TestingController;
  let prismaService: jest.Mocked<PrismaService>;
  let coreConfig: jest.Mocked<CoreConfig>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestingController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            subscription: { deleteMany: jest.fn() },
            session: { deleteMany: jest.fn() },
            emailConfirmation: { deleteMany: jest.fn() },
            yandex: { deleteMany: jest.fn() },
            postFile: { deleteMany: jest.fn() },
            post: { deleteMany: jest.fn() },
            userProfile: { deleteMany: jest.fn() },
            user: { deleteMany: jest.fn() },
            idempotencyKey: { deleteMany: jest.fn() },
          },
        },
        {
          provide: CoreConfig,
          useValue: {
            filesFrontendUrl: 'http://files:3001',
            paymentsFrontendUrl: 'http://payments:3002',
          },
        },
      ],
    }).compile();

    testingController = module.get<TestingController>(TestingController);
    prismaService = module.get(PrismaService);
    coreConfig = module.get(CoreConfig);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('deleteAllData', () => {
    it('should delete all data successfully', async () => {
      // Mock successful axios calls
      mockedAxios.delete.mockResolvedValueOnce({ status: 204 });
      mockedAxios.delete.mockResolvedValueOnce({ status: 204 });

      // Mock successful Prisma transaction
      prismaService.$transaction.mockResolvedValue([]);

      await testingController.deleteAllData();

      // Verify axios calls
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `${coreConfig.filesFrontendUrl}/api/v1/testing/all-data`,
      );
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `${coreConfig.paymentsFrontendUrl}/api/v1/testing/all-data`,
      );

      // Verify Prisma transaction
      expect(prismaService.$transaction).toHaveBeenCalledWith([
        prismaService.subscription.deleteMany(),
        prismaService.session.deleteMany(),
        prismaService.emailConfirmation.deleteMany(),
        prismaService.yandex.deleteMany(),
        prismaService.postFile.deleteMany(),
        prismaService.post.deleteMany(),
        prismaService.userProfile.deleteMany(),
        prismaService.user.deleteMany(),
        prismaService.idempotencyKey.deleteMany(),
      ]);
    });

    it('should throw error when files microservice fails', async () => {
      // Mock failed axios call for files
      mockedAxios.delete.mockResolvedValueOnce({ status: 500 });

      await expect(testingController.deleteAllData()).rejects.toThrow(
        'Failed to delete all data in files',
      );

      // Verify only first axios call was made
      expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw error when payments microservice fails', async () => {
      // Mock successful files call, failed payments call
      mockedAxios.delete.mockResolvedValueOnce({ status: 204 });
      mockedAxios.delete.mockResolvedValueOnce({ status: 500 });

      await expect(testingController.deleteAllData()).rejects.toThrow(
        'Failed to delete all data in payments',
      );

      // Verify both axios calls were made
      expect(mockedAxios.delete).toHaveBeenCalledTimes(2);
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw error when Prisma transaction fails', async () => {
      // Mock successful axios calls
      mockedAxios.delete.mockResolvedValueOnce({ status: 204 });
      mockedAxios.delete.mockResolvedValueOnce({ status: 204 });

      // Mock failed Prisma transaction
      const prismaError = new Error('Database connection failed');
      prismaService.$transaction.mockRejectedValue(prismaError);

      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(testingController.deleteAllData()).rejects.toThrow(
        'Failed to delete all data in lumio',
      );

      // Verify axios calls were made
      expect(mockedAxios.delete).toHaveBeenCalledTimes(2);
      expect(prismaService.$transaction).toHaveBeenCalled();

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});
