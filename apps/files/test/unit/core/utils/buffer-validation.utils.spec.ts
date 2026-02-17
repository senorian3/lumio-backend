import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { validateAndConvertBuffer } from '@files/core/utils/buffer-validation.utils';

describe('validateAndConvertBuffer', () => {
  it('should return the buffer if it is already a Buffer', () => {
    const buffer = Buffer.from('test data');

    const result = validateAndConvertBuffer(buffer);

    expect(result).toBe(buffer);
  });

  it('should convert Uint8Array to Buffer', () => {
    const uint8Array = new Uint8Array([1, 2, 3, 4]);

    const result = validateAndConvertBuffer(uint8Array);

    expect(result).toBeInstanceOf(Buffer);
    expect(result).toEqual(Buffer.from(uint8Array));
  });

  it('should convert Array to Buffer', () => {
    const array = [1, 2, 3, 4];

    const result = validateAndConvertBuffer(array);

    expect(result).toBeInstanceOf(Buffer);
    expect(result).toEqual(Buffer.from(array));
  });

  it('should throw BadRequestDomainException for unsupported buffer type', () => {
    const invalidBuffer = 'invalid string';

    expect(() => {
      validateAndConvertBuffer(invalidBuffer);
    }).toThrow(BadRequestDomainException);
  });
});
