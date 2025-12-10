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
  private readonly secretKey: string;
  private readonly verifyUrl =
    'https://www.google.com/recaptcha/api/siteverify';
  private readonly scoreThreshold = 0.5;

  constructor(private readonly configService: ConfigService) {
    this.secretKey =
      this.configService.get<string>('RECAPTCHA_SECRET_KEY') || '';
  }

  async verify(token: string): Promise<boolean> {
    if (!this.secretKey) {
      return true;
    }

    if (!token || token.trim() === '') {
      return false;
    }

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
      return false;
    }

    const data: RecaptchaResponse = await response.json();

    if (!data.success || data.score < this.scoreThreshold) {
      return false;
    }

    return true;
  }
}
