import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { AppLoggerService } from '@libs/logger/logger.service';
import { validateAndConvertBuffer } from '@files/core/utils/buffer-validation.utils';

describe('validateAndConvertBuffer', () => {
  let mockLogger: AppLoggerService;

  beforeEach(() => {
    mockLogger = {
      error: jest.fn(),
    } as any;
  });

  it('should return the buffer if it is already a Buffer', () => {
    const buffer = Buffer.from('test data');
    const originalname = 'test.jpg';

    const result = validateAndConvertBuffer(buffer, originalname, mockLogger);

    expect(result).toBe(buffer);
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('should convert Uint8Array to Buffer', () => {
    const uint8Array = new Uint8Array([1, 2, 3, 4]);
    const originalname = 'test.jpg';

    const result = validateAndConvertBuffer(
      uint8Array,
      originalname,
      mockLogger,
    );

    expect(result).toBeInstanceOf(Buffer);
    expect(result).toEqual(Buffer.from(uint8Array));
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('should convert Array to Buffer', () => {
    const array = [1, 2, 3, 4];
    const originalname = 'test.jpg';

    const result = validateAndConvertBuffer(array, originalname, mockLogger);

    expect(result).toBeInstanceOf(Buffer);
    expect(result).toEqual(Buffer.from(array));
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('should throw BadRequestDomainException and log error for unsupported buffer type', () => {
    const invalidBuffer = 'invalid string';
    const originalname = 'test.jpg';

    expect(() => {
      validateAndConvertBuffer(invalidBuffer, originalname, mockLogger);
    }).toThrow(BadRequestDomainException);

    expect(mockLogger.error).toHaveBeenCalledWith(
      `Unsupported buffer type for file ${originalname}: string`,
    );
  });
});
