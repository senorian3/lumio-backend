import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@libs/logger/logger.service';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

@Injectable()
export class RetryService {
  constructor(private readonly logger: AppLoggerService) {}

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    const { maxRetries = 5, baseDelay = 1000, maxDelay = 16000 } = options;

    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        return await operation();
      } catch (error) {
        retryCount++;

        if (retryCount >= maxRetries) {
          throw error;
        }

        const delayMs = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
        this.logger.warn(
          `Operation failed (attempt ${retryCount}/${maxRetries}): ${error.message}. Retrying in ${delayMs}ms...`,
        );

        await this.delay(delayMs);
      }
    }

    throw new Error('Max retries exceeded');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
