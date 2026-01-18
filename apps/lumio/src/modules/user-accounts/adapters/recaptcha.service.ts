import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@libs/logger/logger.service';
import { CoreConfig } from '@lumio/core/core.config';

class RecaptchaResponse {
  action: string;
  challenge_ts: string;
  hostname: string;
  score: number;
  success: boolean;
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

    if (!token || token.trim() === '') {
      return false;
    }

    try {
      const result = await fetch(this.verifyUrl, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: `secret=${secretKey}&response=${token}`,
      });

      if (!result.ok) {
        return false;
      }

      const data: RecaptchaResponse = await result.json();

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
