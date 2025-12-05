import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenDomainException } from '@libs/core/exceptions/domain-exceptions';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';
import { NodemailerService } from '@lumio/modules/user-accounts/adapters/nodemailer/nodemailer.service';
import { EmailService } from '@lumio/modules/user-accounts/adapters/nodemailer/template/email-examples';
import { RecaptchaService } from '@lumio/modules/user-accounts/adapters/recaptcha.service';
import { UserRepository } from '@lumio/modules/user-accounts/users/infrastructure/user.repository';
import { passwordRecoveryDto } from '@lumio/modules/user-accounts/users/api/dto/transfer/password-recovery.dto';

export class PasswordRecoveryCommand {
  constructor(public passwordRecoveryDto: passwordRecoveryDto) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase
  implements ICommandHandler<PasswordRecoveryCommand, void>
{
  constructor(
    private userRepository: UserRepository,
    private nodemailerService: NodemailerService,
    private emailService: EmailService,
    private recaptchaService: RecaptchaService,
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
    const newExpirationDate = add(new Date(), { days: 7 });

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
      .catch((er) => console.error('Error in send email:', er));
  }
}
