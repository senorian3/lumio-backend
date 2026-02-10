import { CreatePaymentCompleteMessageDto } from '@libs/dto/transfer/create-payment-complete-message.dto';

export class InputPaymentCompletedDto {
  constructor(
    public id: number,
    public aggregateId: number,
    public aggregateType: string,
    public eventType: string,
    public timestamp: Date,
    public payload: CreatePaymentCompleteMessageDto,
  ) {}
}
