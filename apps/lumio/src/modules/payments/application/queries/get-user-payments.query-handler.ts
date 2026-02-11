import { GetUserPaymentsParams } from '@lumio/modules/payments/api/dto/input/get-user-payments.query';

export class GetUserPaymentsQuery {
  constructor(
    public readonly userId: number,
    public readonly query: GetUserPaymentsParams,
  ) {}
}
