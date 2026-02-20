import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from '@lumio/modules/user-accounts/adapters/crypto.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('CryptoService', () => {
  let service: CryptoService;
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoService],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPasswordHash', () => {
    it('should generate salt and hash the password', async () => {
      const password = 'testPassword123';
      const mockSalt = 'mockSalt';
      const mockHash = 'hashedPassword123';

      (mockBcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const result = await service.createPasswordHash(password);

      expect(result).toBe(mockHash);
      expect(mockBcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, mockSalt);
    });
  });

  describe('comparePasswords', () => {
    it('should return true when passwords match', async () => {
      const password = 'testPassword123';
      const hash = 'hashedPassword123';

      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.comparePasswords(password, hash);

      expect(result).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it('should return false when passwords do not match', async () => {
      const password = 'wrongPassword';
      const hash = 'hashedPassword123';

      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.comparePasswords(password, hash);

      expect(result).toBe(false);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
    });
  });
});
