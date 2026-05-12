import { Test, TestingModule } from '@nestjs/testing';
import { IdempotencyKeyRepository } from '@lumio/modules/payments/domain/infrastructure/idempotency-key.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';

describe('IdempotencyKeyRepository', () => {
  let repository: IdempotencyKeyRepository;

  const mockPrisma = {
    idempotencyKey: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyKeyRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get(IdempotencyKeyRepository);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find idempotency key by id', async () => {
      const mockKey = { id: 'msg-123', expiresAt: new Date() };
      mockPrisma.idempotencyKey.findUnique.mockResolvedValue(mockKey);

      const result = await repository.findById('msg-123');

      expect(result).toEqual(mockKey);
      expect(mockPrisma.idempotencyKey.findUnique).toHaveBeenCalledWith({
        where: { id: 'msg-123' },
      });
    });

    it('should return null when key not found', async () => {
      mockPrisma.idempotencyKey.findUnique.mockResolvedValue(null);

      const result = await repository.findById('unknown');

      expect(result).toBeNull();
    });

    it('should use transaction client when provided', async () => {
      const tx = {
        idempotencyKey: { findUnique: jest.fn().mockResolvedValue(null) },
      };

      await repository.findById('msg-123', tx as any);

      expect(tx.idempotencyKey.findUnique).toHaveBeenCalled();
      expect(mockPrisma.idempotencyKey.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('upsert', () => {
    it('should upsert idempotency key', async () => {
      const expiresAt = new Date();
      mockPrisma.idempotencyKey.upsert.mockResolvedValue({
        id: 'msg-123',
        expiresAt,
      });

      const result = await repository.upsert('msg-123', expiresAt);

      expect(result).toEqual({ id: 'msg-123', expiresAt });
      expect(mockPrisma.idempotencyKey.upsert).toHaveBeenCalledWith({
        where: { id: 'msg-123' },
        update: { expiresAt },
        create: { id: 'msg-123', expiresAt },
      });
    });

    it('should use transaction client when provided', async () => {
      const expiresAt = new Date();
      const tx = {
        idempotencyKey: { upsert: jest.fn().mockResolvedValue({}) },
      };

      await repository.upsert('msg-123', expiresAt, tx as any);

      expect(tx.idempotencyKey.upsert).toHaveBeenCalled();
    });
  });
});
