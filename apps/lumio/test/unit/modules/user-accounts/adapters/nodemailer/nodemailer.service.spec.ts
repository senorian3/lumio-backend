import { Test, TestingModule } from '@nestjs/testing';
import { NodemailerService } from '@lumio/modules/user-accounts/adapters/nodemailer/nodemailer.service';
import { UserAccountsConfig } from '@lumio/modules/user-accounts/config/user-accounts.config';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('NodemailerService', () => {
  let service: NodemailerService;
  let mockTransporter: { sendMail: jest.Mock };

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn(),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodemailerService,
        {
          provide: UserAccountsConfig,
          useValue: {
            smtpHost: 'smtp.test.com',
            smtpPort: 587,
            smtpSecure: false,
            smtpMail: 'test@test.com',
            smtpPassword: 'password123',
          },
        },
      ],
    }).compile();

    service = module.get<NodemailerService>(NodemailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create transporter with correct config', () => {
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.test.com',
      port: 587,
      secure: false,
      auth: {
        user: 'test@test.com',
        pass: 'password123',
      },
    });
  });

  describe('sendEmail', () => {
    const email = 'user@example.com';
    const code = '123456';
    const template = (code: string) => ({
      html: `<p>Your code: ${code}</p>`,
      subject: 'Verification Code',
    });

    it('should send email with correct parameters', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      await service.sendEmail(email, code, template);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Techgram" <test@test.com>',
        to: email,
        subject: 'Verification Code',
        html: '<p>Your code: 123456</p>',
      });
    });

    it('should throw error when sendMail fails', async () => {
      mockTransporter.sendMail.mockRejectedValue(
        new Error('SMTP connection failed'),
      );

      await expect(service.sendEmail(email, code, template)).rejects.toThrow(
        'SMTP connection failed',
      );
    });
  });
});
