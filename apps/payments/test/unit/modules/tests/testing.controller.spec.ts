import { Test, TestingModule } from '@nestjs/testing';
import { TestingController } from '@payments/modules/tests/testing.controller';
import { PrismaService } from '@payments/prisma/prisma.service';

describe('TestingController', () => {
  let testingController: TestingController;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestingController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            payment: { deleteMany: jest.fn() },
            outboxMessage: { deleteMany: jest.fn() },
          },
        },
      ],
    }).compile();

    testingController = module.get<TestingController>(TestingController);
    prismaService = module.get(PrismaService);
  });

  describe('deleteAllData', () => {
    it('should delete all data successfully', async () => {
      // Mock successful Prisma transaction
      prismaService.$transaction.mockResolvedValue([]);

      await testingController.deleteAllData();

      // Verify Prisma transaction
      expect(prismaService.$transaction).toHaveBeenCalledWith([
        prismaService.payment.deleteMany(),
        prismaService.outboxMessage.deleteMany(),
      ]);
    });

    it('should handle Prisma transaction failure', async () => {
      // Mock failed Prisma transaction
      const prismaError = new Error('Database transaction failed');
      prismaService.$transaction.mockRejectedValue(prismaError);

      await expect(testingController.deleteAllData()).rejects.toThrow(
        'Database transaction failed',
      );

      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should delete both payment and outboxMessage records', async () => {
      // Mock successful transaction with specific counts
      const mockDeleteResults = [{ count: 5 }, { count: 3 }];
      prismaService.$transaction.mockResolvedValue(mockDeleteResults);

      await testingController.deleteAllData();

      expect(prismaService.$transaction).toHaveBeenCalledWith([
        prismaService.payment.deleteMany(),
        prismaService.outboxMessage.deleteMany(),
      ]);
    });

    it('should handle empty database', async () => {
      // Mock transaction with zero deletions
      const mockDeleteResults = [{ count: 0 }, { count: 0 }];
      prismaService.$transaction.mockResolvedValue(mockDeleteResults);

      await testingController.deleteAllData();

      expect(prismaService.$transaction).toHaveBeenCalled();
    });
  });
});
