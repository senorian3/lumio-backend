import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';

type BufferLike = Buffer | Uint8Array | number[];

function isBufferLike(value: unknown): value is BufferLike {
  return (
    Buffer.isBuffer(value) ||
    value instanceof Uint8Array ||
    Array.isArray(value)
  );
}

export function validateAndConvertBuffer(buffer: unknown): Buffer {
  if (!isBufferLike(buffer)) {
    throw BadRequestDomainException.create(
      'File cannot be uploaded. Unsupported buffer type',
      'file',
    );
  }

  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
}
