import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.repository';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';

export class DeleteNotificationCommand {
  constructor(
    public readonly id: string,
    public readonly userId: number,
  ) {}
}

@CommandHandler(DeleteNotificationCommand)
export class DeleteNotificationCommandHandler implements ICommandHandler<
  DeleteNotificationCommand,
  void
> {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(command: DeleteNotificationCommand): Promise<void> {
    const deleted = await this.notificationRepository.softDelete(
      command.id,
      command.userId,
    );

    if (!deleted) {
      throw NotFoundDomainException.create('Notification not found', 'id');
    }
  }
}
