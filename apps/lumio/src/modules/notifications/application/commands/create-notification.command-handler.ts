import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateNotificationDto } from '@lumio/modules/notifications/api/dto/transfer/create-notifications.transfer.dto';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notification.repository';

export class CreateNotificationCommand {
  constructor(public readonly dto: CreateNotificationDto) {}
}

@CommandHandler(CreateNotificationCommand)
export class CreateNotificationCommandHandler implements ICommandHandler<
  CreateNotificationCommand,
  void
> {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(command: CreateNotificationCommand): Promise<void> {
    await this.notificationRepository.createNotification(command.dto);
  }
}
