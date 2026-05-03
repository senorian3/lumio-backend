import { SetMetadata } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

export const INTERNAL_API_KEY_HEADER = 'x-internal-api-key';
export const INTERNAL_SERVICE_HEADER = 'x-internal-service';
export const INTERNAL_ALLOWED_SERVICES_KEY = 'internal:allowed-services';

export type InternalApiKeys = Record<string, string>;

export interface InternalCallerContext {
  service: string;
}

export interface InternalRequest {
  internalCaller?: InternalCallerContext;
}

export const AllowInternalServices = (...services: string[]) =>
  SetMetadata(INTERNAL_ALLOWED_SERVICES_KEY, services);

export function buildInternalApiHeaders(
  serviceName: string,
  apiKey: string,
): Record<string, string> {
  return {
    [INTERNAL_SERVICE_HEADER]: serviceName,
    [INTERNAL_API_KEY_HEADER]: apiKey,
  };
}

export function parseInternalApiKeys(
  rawValue: string | undefined,
  fallbackApiKey?: string,
): InternalApiKeys {
  if (!rawValue?.trim()) {
    return fallbackApiKey
      ? {
          lumio: fallbackApiKey,
          chat: fallbackApiKey,
          'super-admin': fallbackApiKey,
        }
      : {};
  }

  const parsed = JSON.parse(rawValue) as Record<string, unknown>;

  return Object.entries(parsed).reduce<InternalApiKeys>(
    (acc, [service, key]) => {
      if (typeof key === 'string' && key.trim()) {
        acc[service] = key;
      }

      return acc;
    },
    {},
  );
}

export function isInternalApiKeyMatch(
  providedApiKey: string,
  expectedApiKey: string,
): boolean {
  const provided = Buffer.from(providedApiKey);
  const expected = Buffer.from(expectedApiKey);

  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}
