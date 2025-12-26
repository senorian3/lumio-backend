import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@libs/logger/logger.service';
import { CoreConfig } from '@lumio/core/core.config';

class RecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

@Injectable()
export class RecaptchaService {
  private readonly verifyUrl =
    'https://www.google.com/recaptcha/api/siteverify';
  private readonly scoreThreshold = 0.5;

  constructor(
    private readonly coreConfig: CoreConfig,
    private readonly loggerService: AppLoggerService,
  ) {}

  private getSecretKey(): string {
    return this.coreConfig.recaptchaSecretKey || '';
  }

  async verify(token: string): Promise<boolean> {
    const secretKey = this.getSecretKey();

    if (!secretKey) {
      return true;
    }

    if (!token || token.trim() === '') {
      return false;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', secretKey);
      formData.append('response', token);

      const response = await fetch(this.verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        return false;
      }

      const data: RecaptchaResponse = await response.json();

      if (!data.success || data.score < this.scoreThreshold) {
        return false;
      }

      return true;
    } catch (error) {
      this.loggerService.error(
        `Ошибка проверки reCAPTCHA: ${error.message}`,
        error.stack,
        RecaptchaService.name,
      );
      return false;
    }
  }
}
