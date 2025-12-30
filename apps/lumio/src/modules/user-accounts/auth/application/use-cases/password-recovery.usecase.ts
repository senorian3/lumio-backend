import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenDomainException } from '@libs/core/exceptions/domain-exceptions';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';
import { NodemailerService } from '@lumio/modules/user-accounts/adapters/nodemailer/nodemailer.service';
import { EmailService } from '@lumio/modules/user-accounts/adapters/nodemailer/template/email-examples';
import { RecaptchaService } from '@lumio/modules/user-accounts/adapters/recaptcha.service';
import { PasswordRecoveryTransferDto } from '@lumio/modules/user-accounts/users/api/dto/transfer/password-recovery.transferdto';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { AppLoggerService } from '@libs/logger/logger.service';

export class PasswordRecoveryCommand {
  constructor(public passwordRecoveryDto: PasswordRecoveryTransferDto) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase implements ICommandHandler<
  PasswordRecoveryCommand,
  void
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly nodemailerService: NodemailerService,
    private readonly emailService: EmailService,
    private readonly recaptchaService: RecaptchaService,
    private readonly loggerService: AppLoggerService,
  ) {}

  async execute({
    passwordRecoveryDto,
  }: PasswordRecoveryCommand): Promise<void> {
    const isRecaptchaValid = await this.recaptchaService.verify(
      passwordRecoveryDto.recaptchaToken,
    );

    if (!isRecaptchaValid) {
      throw ForbiddenDomainException.create(
        'reCAPTCHA verification failed',
        'recaptchaToken',
      );
    }

    const user = await this.userRepository.findUserByEmail(
      passwordRecoveryDto.email,
    );

    if (!user) {
      throw ForbiddenDomainException.create('User does not exist', 'email');
    }

    const newConfirmationCode = randomUUID();
    const newExpirationDate = add(new Date(), { hours: 1 });

    await this.userRepository.updateCodeAndExpirationDate(
      user.id,
      newConfirmationCode,
      newExpirationDate,
    );

    this.nodemailerService
      .sendEmail(
        user.email,
        newConfirmationCode,
        this.emailService.passwordRecovery.bind(this.emailService),
      )
      .catch((error) =>
        this.loggerService.error(
          `Ошибка отправки email:${error}`,
          error.stack,
          NodemailerService.name,
        ),
      );

    return;
  }
}
