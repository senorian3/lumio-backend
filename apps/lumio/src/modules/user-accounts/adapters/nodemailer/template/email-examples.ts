import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  registrationEmail(code: string) {
    return {
      html: `
      <div style="font-family: Arial, sans-serif; background: linear-gradient(135deg,#fdfbfb,#ebedee); padding: 20px; text-align: center; color: #262626;">
        <h1 style="color:#e1306c; font-weight: bold;">✨ Welcome to Lumio ✨</h1>
        <p style="font-size: 16px; margin: 20px 0;">
          You're almost part of the community! Tap below to confirm your email.
        </p>
        <a href="https://lumio.su/confirm-email?code=${code}"
           style="display:inline-block; background:#e1306c; color:#fff; padding:12px 24px; border-radius:30px; text-decoration:none; font-weight:bold; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          Complete Registration
        </a>
        <p style="margin-top:30px; font-size:12px; color:#8e8e8e;">
          This link will expire soon. Don’t miss out 💫
        </p>
      </div>
    `,
      subject: '✨ Registration Confirmation',
    };
  }

  passwordRecovery(code: string) {
    return {
      html: `
        <div style="font-family: Arial, sans-serif; background: linear-gradient(135deg,#fff,#f9f9f9); padding: 20px; text-align: center; color: #262626;">
          <h1 style="color:#0095f6; font-weight: bold;">🔑 Reset Your Password</h1>
          <p style="font-size: 16px; margin: 20px 0;">
            Forgot your password? No worries — tap below to recover it.
          </p>
          <a href="https://lumio.su/password-recovery?recoveryCode=${code}"
             style="display:inline-block; background:#0095f6; color:#fff; padding:12px 24px; border-radius:30px; text-decoration:none; font-weight:bold; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            Recover Password
          </a>
          <p style="margin-top:30px; font-size:12px; color:#8e8e8e;">
            If you didn’t request this, ignore the email 🚫
          </p>
        </div>
      `,
      subject: '🔑 Password Recovery',
    };
  }
}
