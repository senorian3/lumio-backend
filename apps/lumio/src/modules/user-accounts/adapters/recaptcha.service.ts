import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

@Injectable()
export class RecaptchaService {
  private readonly logger = new Logger(RecaptchaService.name);
  private readonly secretKey: string;
  private readonly verifyUrl =
    'https://www.google.com/recaptcha/api/siteverify';
  private readonly scoreThreshold = 0.5;

  constructor(private configService: ConfigService) {
    this.secretKey =
      this.configService.get<string>('RECAPTCHA_SECRET_KEY') || '';
    if (!this.secretKey) {
      this.logger.warn(
        'RECAPTCHA_SECRET_KEY is not set. reCAPTCHA verification will be disabled.',
      );
    }
  }

  async verify(token: string): Promise<boolean> {
    // If secret key is not set, skip verification (for development)
    if (!this.secretKey) {
      this.logger.debug('RECAPTCHA_SECRET_KEY not set, skipping verification');
      return true;
    }

    if (!token || token.trim() === '') {
      this.logger.warn('Empty reCAPTCHA token provided');
      return false;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', this.secretKey);
      formData.append('response', token);

      const response = await fetch(this.verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        this.logger.error(`reCAPTCHA API returned status ${response.status}`);
        return false;
      }

      const data: RecaptchaResponse = await response.json();

      if (!data.success) {
        this.logger.warn(
          `reCAPTCHA verification failed: ${data['error-codes']?.join(', ')}`,
        );
        return false;
      }

      // Check score threshold
      if (data.score < this.scoreThreshold) {
        this.logger.warn(
          `reCAPTCHA score ${data.score} below threshold ${this.scoreThreshold}`,
        );
        return false;
      }

      this.logger.debug(
        `reCAPTCHA verification passed with score ${data.score}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error during reCAPTCHA verification: ${error.message}`,
      );
      return false;
    }
  }
}
