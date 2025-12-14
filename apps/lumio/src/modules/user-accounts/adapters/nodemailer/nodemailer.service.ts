import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { UserAccountsConfig } from '../../config/user-accounts.config';
import { AppLoggerService } from '@libs/logger/logger.service';

@Injectable()
export class NodemailerService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly userAccountsConfig: UserAccountsConfig,
    private readonly logger: AppLoggerService,
  ) {
    const host = this.userAccountsConfig.smtpHost;
    const port = this.userAccountsConfig.smtpPort;
    const secure = this.userAccountsConfig.smtpSecure;
    const user = this.userAccountsConfig.smtpUser;
    const password = this.userAccountsConfig.smtpPassword;

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
        from: `"Techgram" <${this.userAccountsConfig.smtpUser}>`,
        to: email,
        subject,
        html,
      });
      this.logger.log(
        `Email успешно отправлен на ${email}`,
        NodemailerService.name,
      );
    } catch (error) {
      this.logger.error(
        `Ошибка отправки email на ${email}`,
        error.stack,
        NodemailerService.name,
      );
      throw new Error('Не удалось отправить email');
    }
  }
}
