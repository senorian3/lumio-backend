import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsHttpAdapter } from '@lumio/modules/payments/application/payments-http.adapter';
import { CoreConfig } from '@lumio/core/core.config';
import axios from 'axios';

jest.mock('axios');

describe('PaymentsHttpAdapter', () => {
  let adapter: PaymentsHttpAdapter;
  const mockAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsHttpAdapter,
        {
          provide: CoreConfig,
          useValue: {
            paymentsFrontendUrl: 'http://payments-service:3000',
            internalApiKey: 'test-api-key',
          },
        },
      ],
    }).compile();

    adapter = module.get<PaymentsHttpAdapter>(PaymentsHttpAdapter);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('createPaymentUrl', () => {
    it('should send POST request with correct dto and headers', async () => {
      const mockResponse = { data: { url: 'https://stripe.com/checkout/123' } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const dto = {
        profileId: 1,
        subscriptionType: '1 month',
      } as any;

      const result = await adapter.createPaymentUrl(
        'subscriptions/create',
        dto,
      );

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://payments-service:3000/subscriptions/create',
        dto,
        {
          headers: expect.objectContaining({
            'X-Internal-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          }),
        },
      );
      expect(result).toEqual({ url: 'https://stripe.com/checkout/123' });
    });

    it('should pass additional headers', async () => {
      mockAxios.post.mockResolvedValue({ data: {} });

      await adapter.createPaymentUrl('endpoint', {} as any, {
        'X-Custom': 'value',
      });

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        {
          headers: expect.objectContaining({
            'X-Custom': 'value',
          }),
        },
      );
    });

    it('should throw error when request fails', async () => {
      mockAxios.post.mockRejectedValue(new Error('Payment service error'));

      await expect(
        adapter.createPaymentUrl('endpoint', {} as any),
      ).rejects.toThrow('Payment service error');
    });
  });

  describe('updateAutoRenewal', () => {
    it('should send PATCH request with correct dto and headers', async () => {
      mockAxios.patch.mockResolvedValue({ data: {} });

      const dto = {
        subscriptionId: 'sub_123',
        autoRenewal: false,
      } as any;

      await adapter.updateAutoRenewal('subscriptions/auto-renewal', dto);

      expect(mockAxios.patch).toHaveBeenCalledWith(
        'http://payments-service:3000/subscriptions/auto-renewal',
        dto,
        {
          headers: expect.objectContaining({
            'X-Internal-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          }),
        },
      );
    });

    it('should pass additional headers', async () => {
      mockAxios.patch.mockResolvedValue({ data: {} });

      await adapter.updateAutoRenewal('endpoint', {} as any, {
        'X-Custom': 'header',
      });

      expect(mockAxios.patch).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        {
          headers: expect.objectContaining({
            'X-Custom': 'header',
          }),
        },
      );
    });

    it('should throw error when request fails', async () => {
      mockAxios.patch.mockRejectedValue(new Error('Update failed'));

      await expect(
        adapter.updateAutoRenewal('endpoint', {} as any),
      ).rejects.toThrow('Update failed');
    });
  });
});
