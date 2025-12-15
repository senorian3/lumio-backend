import { Test, TestingModule } from '@nestjs/testing';
import * as nodemailer from 'nodemailer';
import { NodemailerService } from '@lumio/modules/user-accounts/adapters/nodemailer/nodemailer.service';
import { UserAccountsConfig } from '@lumio/modules/user-accounts/config/user-accounts.config';
import { AppLoggerService } from '@libs/logger/logger.service';

jest.mock('nodemailer');

describe('NodemailerService', () => {
  let service: NodemailerService;
  let mockUserAccountsConfig: UserAccountsConfig;
  let mockLoggerService: AppLoggerService;
  let mockTransporter: { sendMail: jest.Mock };

  const mockConfig = {
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: 'user@example.com',
    smtpPassword: 'password123',
  };

  const mockTemplate = (code: string) => ({
    html: `<p>Your code is: ${code}</p>`,
    subject: 'Test Email',
  });

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
          useValue: mockConfig,
        },
        {
          provide: AppLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NodemailerService>(NodemailerService);
    mockUserAccountsConfig = module.get<UserAccountsConfig>(UserAccountsConfig);
    mockLoggerService = module.get<AppLoggerService>(AppLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(mockUserAccountsConfig).toBeDefined();
  });

  describe('constructor', () => {
    it('should create transporter with correct configuration', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: mockConfig.smtpHost,
        port: mockConfig.smtpPort,
        secure: mockConfig.smtpSecure,
        auth: {
          user: mockConfig.smtpUser,
          pass: mockConfig.smtpPassword,
        },
      });
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      // Arrange
      const email = 'recipient@example.com';
      const code = '123456';
      mockTransporter.sendMail.mockResolvedValue({});

      // Act
      await service.sendEmail(email, code, mockTemplate);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: `"Techgram" <${mockConfig.smtpUser}>`,
        to: email,
        subject: 'Test Email',
        html: `<p>Your code is: ${code}</p>`,
      });
    });

    it('should handle email sending error', async () => {
      // Arrange
      const email = 'recipient@example.com';
      const code = '123456';
      const error = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.sendEmail(email, code, mockTemplate),
      ).rejects.toThrow('Не удалось отправить email');
    });

    it('should use template to generate html and subject', async () => {
      // Arrange
      const email = 'recipient@example.com';
      const code = 'ABCDEF';
      const customTemplate = (code: string) => ({
        html: `<h1>Custom: ${code}</h1>`,
        subject: 'Custom Subject',
      });
      mockTransporter.sendMail.mockResolvedValue({});

      // Act
      await service.sendEmail(email, code, customTemplate);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: `"Techgram" <${mockConfig.smtpUser}>`,
        to: email,
        subject: 'Custom Subject',
        html: `<h1>Custom: ${code}</h1>`,
      });
    });

    it('should log error when email sending fails', async () => {
      // Arrange
      const email = 'recipient@example.com';
      const code = '123456';
      const error = new Error('Network error');
      mockTransporter.sendMail.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.sendEmail(email, code, mockTemplate),
      ).rejects.toThrow('Не удалось отправить email');
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        `Ошибка отправки email на ${email}`,
        error.stack,
        NodemailerService.name,
      );
    });

    it('should log success when email is sent', async () => {
      // Arrange
      const email = 'recipient@example.com';
      const code = '123456';
      mockTransporter.sendMail.mockResolvedValue({});

      // Act
      await service.sendEmail(email, code, mockTemplate);

      // Assert
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        `Email успешно отправлен на ${email}`,
        NodemailerService.name,
      );
    });
  });
});
