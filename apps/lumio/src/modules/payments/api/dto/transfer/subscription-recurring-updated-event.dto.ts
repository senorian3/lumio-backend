import { CreateSubscriptionUpdateMessageDto } from '@libs/dto/transfer/create-subscription-update-message.dto';

export class SubscriptionRecurringUpdatedEvent {
  constructor(
    public id: number,
    public aggregateId: number,
    public aggregateType: string,
    public eventType: string,
    public payload: CreateSubscriptionUpdateMessageDto,
    public timestamp: Date,
  ) {}
}
