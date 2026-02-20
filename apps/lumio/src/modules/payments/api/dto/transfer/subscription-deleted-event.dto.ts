import { CreateSubscriptionDeletedMessageDto } from '@libs/dto/transfer/create-subscription-deleted-message.dto';

export class SubscriptionDeletedEvent {
  constructor(
    public id: number,
    public aggregateId: string,
    public aggregateType: string,
    public eventType: string,
    public payload: CreateSubscriptionDeletedMessageDto,
    public timestamp: Date,
  ) {}
}
