import { Test, TestingModule } from '@nestjs/testing';
import { TestingController } from '@files/modules/tests/testing.controller';
import { PrismaService } from '@files/prisma/prisma.service';
import { S3FilesHttpAdapter } from '@files/core/adapters/s3-files-http.adapter';

describe('TestingController', () => {
  let testingController: TestingController;
  let prismaService: jest.Mocked<PrismaService>;
  let s3Adapter: jest.Mocked<S3FilesHttpAdapter>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestingController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            postFile: { deleteMany: jest.fn() },
            userAvatar: { deleteMany: jest.fn() },
          },
        },
        {
          provide: S3FilesHttpAdapter,
          useValue: {
            deleteAllFiles: jest.fn(),
          },
        },
      ],
    }).compile();

    testingController = module.get<TestingController>(TestingController);
    prismaService = module.get(PrismaService);
    s3Adapter = module.get(S3FilesHttpAdapter);
  });

  describe('deleteAllData', () => {
    it('should delete all data successfully', async () => {
      // Mock successful S3 deletion
      s3Adapter.deleteAllFiles.mockResolvedValue(undefined);

      // Mock successful Prisma transaction
      prismaService.$transaction.mockResolvedValue([]);

      await testingController.deleteAllData();

      // Verify S3 deletion was called
      expect(s3Adapter.deleteAllFiles).toHaveBeenCalled();

      // Verify Prisma transaction
      expect(prismaService.$transaction).toHaveBeenCalledWith([
        prismaService.postFile.deleteMany(),
        prismaService.userAvatar.deleteMany(),
      ]);
    });

    it('should handle S3 deletion failure', async () => {
      // Mock failed S3 deletion
      const s3Error = new Error('S3 connection failed');
      s3Adapter.deleteAllFiles.mockRejectedValue(s3Error);

      await expect(testingController.deleteAllData()).rejects.toThrow(
        'S3 connection failed',
      );

      // Verify S3 deletion was attempted
      expect(s3Adapter.deleteAllFiles).toHaveBeenCalled();
      // Verify Prisma transaction was not called
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should handle Prisma transaction failure', async () => {
      // Mock successful S3 deletion
      s3Adapter.deleteAllFiles.mockResolvedValue(undefined);

      // Mock failed Prisma transaction
      const prismaError = new Error('Database transaction failed');
      prismaService.$transaction.mockRejectedValue(prismaError);

      await expect(testingController.deleteAllData()).rejects.toThrow(
        'Database transaction failed',
      );

      // Verify both operations were attempted
      expect(s3Adapter.deleteAllFiles).toHaveBeenCalled();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should delete files before database records', async () => {
      // Track call order
      const callOrder: string[] = [];
      s3Adapter.deleteAllFiles.mockImplementation(async () => {
        callOrder.push('s3');
        return undefined;
      });
      prismaService.$transaction.mockImplementation(async (arg) => {
        callOrder.push('prisma');
        // $transaction принимает массив промисов (результатов deleteMany)
        if (Array.isArray(arg)) {
          // Массив промисов
          return Promise.all(arg);
        } else {
          // Callback функция (не используется в нашем коде)
          const tx = {} as any;
          return arg(tx);
        }
      });

      await testingController.deleteAllData();

      // Verify S3 deletion happens before Prisma transaction
      expect(callOrder).toEqual(['s3', 'prisma']);
    });
  });
});
