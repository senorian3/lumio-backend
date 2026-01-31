export class InputPaymentAcknowledgmentDto {
  constructor(
    public messageId: number,
    public status: 'received' | 'processed',
    public details: string,
  ) {}
}
