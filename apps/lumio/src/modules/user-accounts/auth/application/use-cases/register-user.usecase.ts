import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { registrationDto } from '../../dto/registration.dto';
import { UserRepository } from '../../../users/infrastructure/repositories/user.repository';
import { DomainException } from '../../../../../../../../libs/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../../../../libs/core/exceptions/domain-exception-codes';
import { CreateUserCommand } from '../../../users/application/use-cases/create-user.use-case';
import { NodemailerService } from '../../../adapters/nodemeiler/nodemeiler.service';
import { EmailService } from '../../../adapters/nodemeiler/template/email-examples';

export class RegisterUserCommand {
  constructor(public dto: registrationDto) {}
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserUseCase
  implements ICommandHandler<RegisterUserCommand, void>
{
  constructor(
    private userRepository: UserRepository,
    private nodemailerService: NodemailerService,
    private emailService: EmailService,
    private readonly commandBus: CommandBus,
  ) {}

  async execute({ dto }: RegisterUserCommand): Promise<void> {
    const user = await this.userRepository.doesExistByUsernameOrEmail(
      dto.username,
      dto.email,
    );
    if (user) {
      if (user.username === dto.username) {
        throw new DomainException(
          'Login is already taken',
          DomainExceptionCode.BadRequest,
          [],
        );
      } else {
        throw new DomainException(
          'Email is already registered',
          DomainExceptionCode.BadRequest,
          [],
        );
      }
    }
    const newUserId = await this.commandBus.execute<CreateUserCommand, number>(
      new CreateUserCommand({ ...dto }),
    );

    const emailConfirmation =
      await this.userRepository.findByCodeOrIdEmailConfirmation({
        userId: newUserId,
      });
    if (!emailConfirmation) {
      throw new DomainException(
        'Email confirmation not found',
        DomainExceptionCode.BadRequest,
        [],
      );
    }
    this.nodemailerService
      .sendEmail(
        dto.email,
        emailConfirmation.confirmationCode,
        this.emailService.registrationEmail.bind(this.emailService),
      )
      .catch((er) => console.error('error in send email:', er));
  }
}
