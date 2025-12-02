import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  registrationEmail(code: string) {
    return {
      html: `
        <h1>Thank you for your registration</h1>
        <p>To finish registration, please follow the link below:</p>
        <a href='https://somesite.com/confirm-email?code=${code}'>Complete Registration</a>
      `,
      subject: 'Registration Confirmation',
    };
  }

  passwordRecovery(code: string) {
    return {
      html: `
        <h1>Password Recovery</h1>
        <p>To reset your password, please follow the link below:</p>
        <a href=' https://somesite.com/password-recovery?recoveryCode=${code}'>Recover Password</a>
      `,
      subject: 'Password Recovery',
    };
  }
}
