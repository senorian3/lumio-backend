import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { AppLoggerService } from '@libs/logger/logger.service';

export function validateAndConvertBuffer(
  buffer: any,
  originalname: string,
  logger: AppLoggerService,
): Buffer {
  if (Buffer.isBuffer(buffer)) {
    return buffer;
  } else if (buffer instanceof Uint8Array) {
    return Buffer.from(buffer);
  } else if (Array.isArray(buffer)) {
    return Buffer.from(buffer);
  } else {
    logger.error(
      `Unsupported buffer type for file ${originalname}: ${typeof buffer}`,
    );
    throw BadRequestDomainException.create(
      'File cannot be uploaded. Unsupported buffer type',
      'file',
    );
  }
}
