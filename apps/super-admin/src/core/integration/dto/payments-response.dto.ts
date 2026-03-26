export interface PaymentsResponse {
  items: Array<{
    id: number;
    datePayment: string;
    endDate: string;
    amount: number;
    currency: string;
    paymentProvider: string;
    subscriptionType: string | null;
  }>;
  total: number;
  page: number;
  limit: number;
}
