import { Request } from 'express';

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  maxAge: number;
  path: string;
  domain?: string;
  signed?: boolean;
}

export function getRefreshTokenCookieOptions(req?: Request): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const host = req?.get('host') || '';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

  const baseOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction && !isLocalhost,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };

  if (isProduction) {
    return {
      ...baseOptions,
      domain: '.lumio.su',
    };
  }

  return baseOptions;
}

export function getClearCookieOptions(req?: Request): CookieOptions {
  const options = getRefreshTokenCookieOptions(req);
  return { ...options, maxAge: 0 };
}
