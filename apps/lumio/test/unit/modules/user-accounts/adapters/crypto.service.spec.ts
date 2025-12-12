import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { CryptoService } from '@lumio/modules/user-accounts/adapters/crypto.service';

jest.mock('bcrypt');

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoService],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPasswordHash', () => {
    it('should create password hash with salt', async () => {
      // Arrange
      const password = 'MySecretPassword123';
      const salt = 'generated-salt';
      const hash = 'hashed-password';
      (bcrypt.genSalt as jest.Mock).mockResolvedValue(salt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hash);

      // Act
      const result = await service.createPasswordHash(password);

      // Assert
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, salt);
      expect(result).toBe(hash);
    });

    it('should handle bcrypt errors', async () => {
      // Arrange
      const password = 'MySecretPassword123';
      (bcrypt.genSalt as jest.Mock).mockRejectedValue(
        new Error('BCrypt error'),
      );

      // Act & Assert
      await expect(service.createPasswordHash(password)).rejects.toThrow(
        'BCrypt error',
      );
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {
      // Arrange
      const password = 'MySecretPassword123';
      const hash = 'hashed-password';
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.comparePasswords(password, hash);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      // Arrange
      const password = 'WrongPassword';
      const hash = 'hashed-password';
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await service.comparePasswords(password, hash);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it('should handle bcrypt compare errors', async () => {
      // Arrange
      const password = 'MySecretPassword123';
      const hash = 'hashed-password';
      (bcrypt.compare as jest.Mock).mockRejectedValue(
        new Error('Compare error'),
      );

      // Act & Assert
      await expect(service.comparePasswords(password, hash)).rejects.toThrow(
        'Compare error',
      );
    });
  });
});
