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
    const mail = this.userAccountsConfig.smtpMail;
    const password = this.userAccountsConfig.smtpPassword;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: mail,
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
        from: `"Techgram" <${this.userAccountsConfig.smtpMail}>`,
        to: email,
        subject,
        html,
      });
    } catch (error) {
      throw error;
    }
  }
}
