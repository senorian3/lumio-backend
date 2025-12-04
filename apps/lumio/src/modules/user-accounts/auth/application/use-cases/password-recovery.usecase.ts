import { passwordRecoveryDto } from '../../dto/password-recovery.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../../../users/infrastructure/repositories/user.repository';
import { NodemailerService } from '../../../adapters/nodemailer/nodemeiler.service';
import { EmailService } from '../../../adapters/nodemailer/template/email-examples';
import { RecaptchaService } from '../../../adapters/recaptcha.service';
import { ForbiddenDomainException } from '../../../../../../../../libs/core/exceptions/domain-exceptions';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';

export class PasswordRecoveryCommand {
  constructor(public dto: passwordRecoveryDto) {}
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

  async execute({ dto }: PasswordRecoveryCommand): Promise<void> {
    const isRecaptchaValid = await this.recaptchaService.verify(
      dto.recaptchaToken,
    );
    if (!isRecaptchaValid) {
      throw ForbiddenDomainException.create(
        'reCAPTCHA verification failed',
        'recaptchaToken',
      );
    }

    const user = await this.userRepository.findUserByEmail(dto.email);
    if (!user) {
      throw ForbiddenDomainException.create('User does not exist', 'email');
      return;
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
