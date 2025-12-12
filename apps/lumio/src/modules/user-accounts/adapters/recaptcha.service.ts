import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

  constructor(private readonly configService: ConfigService) {}

  private getSecretKey(): string {
    return this.configService.get<string>('RECAPTCHA_SECRET_KEY') || '';
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
      console.error('Error verifying reCAPTCHA:', error);
      // In case of network errors or JSON parsing errors, return false
      return false;
    }
  }
}
