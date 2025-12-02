import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { UserAccountsConfig } from '../../config/user-accounts.config';

@Injectable()
export class NodemailerService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly userAccountsConfig: UserAccountsConfig) {
    const host = this.userAccountsConfig.smtpHost;
    const port = this.userAccountsConfig.smtpPort;
    const secure = this.userAccountsConfig.smtpSecure;
    const user = this.userAccountsConfig.smtpUser;
    const password = this.userAccountsConfig.smtpPassword;

    if (!user || !password) {
      throw new Error('Отсутствуют данные для аутентификации email');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: password,
      },
    });
  }

  async sendEmail(
    email: string,
    code: string,
    template: (code: string) => { html: string; subject: string },
  ): Promise<void> {
    const { html, subject } = template(code);

    try {
      await this.transporter.sendMail({
        from: `"BloggerPlatform" <${this.userAccountsConfig.smtpUser}>`,
        to: email,
        subject,
        html,
      });
    } catch (error) {
      console.error('Ошибка отправки email:', error);
      throw new Error('Не удалось отправить email');
    }
  }
}
