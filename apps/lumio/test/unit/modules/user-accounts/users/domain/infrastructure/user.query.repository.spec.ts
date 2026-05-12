import { Test, TestingModule } from '@nestjs/testing';
import { QueryUserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.query.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';

describe('QueryUserRepository', () => {
  let repository: QueryUserRepository;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryUserRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get(QueryUserRepository);
    jest.clearAllMocks();
  });

  describe('getById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 1,
        username: 'test',
        email: 'test@test.com',
        emailConfirmation: {},
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.getById(1);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { emailConfirmation: true },
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.getById(999);

      expect(result).toBeNull();
    });
  });
});
