import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { NodemailerService } from '@lumio/modules/user-accounts/adapters/nodemailer/nodemailer.service';
import { EmailService } from '@lumio/modules/user-accounts/adapters/nodemailer/template/email-examples';
import { CreateUserCommand } from '@lumio/modules/user-accounts/users/application/use-cases/create-user.use-case';
import { registrationDto } from '@lumio/modules/user-accounts/users/api/dto/transfer/registration.dto';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { AppLoggerService } from '@libs/logger/logger.service';

export class RegisterUserCommand {
  constructor(public registerDto: registrationDto) {}
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserUseCase implements ICommandHandler<
  RegisterUserCommand,
  void
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly nodemailerService: NodemailerService,
    private readonly emailService: EmailService,
    private readonly commandBus: CommandBus,
    private readonly loggerService: AppLoggerService,
  ) {}

  async execute({ registerDto }: RegisterUserCommand): Promise<void> {
    const user = await this.userRepository.doesExistByUsernameOrEmail(
      registerDto.username,
      registerDto.email,
    );
    if (user) {
      if (user.username === registerDto.username) {
        throw BadRequestDomainException.create(
          'User with this username is already registered',
          'username',
        );
      } else {
        throw BadRequestDomainException.create(
          'User with this email is already registered',
          'email',
        );
      }
    }
    const newUserId = await this.commandBus.execute<CreateUserCommand, number>(
      new CreateUserCommand({ ...registerDto }),
    );

    const emailConfirmation =
      await this.userRepository.findByCodeOrIdEmailConfirmation({
        userId: newUserId,
      });

    if (!emailConfirmation) {
      throw BadRequestDomainException.create(
        'Email confirmation not found',
        'emailConfirmation',
      );
    }

    this.nodemailerService
      .sendEmail(
        registerDto.email,
        emailConfirmation.confirmationCode,
        this.emailService.registrationEmail.bind(this.emailService),
      )
      .catch((error) => {
        this.loggerService.error(
          `Ошибка отправки email: ${error.message}`,
          error.stack,
          RegisterUserUseCase.name,
        );
      });

    return;
  }
}
