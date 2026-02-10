import { CreatePaymentCompleteMessageDto } from '@libs/dto/transfer/create-payment-complete-message.dto';

export class PaymentCompletedEvent {
  constructor(
    public id: number,
    public aggregateId: number,
    public aggregateType: string,
    public eventType: string,
    public payload: CreatePaymentCompleteMessageDto,
    public timestamp: Date,
  ) {}
}
