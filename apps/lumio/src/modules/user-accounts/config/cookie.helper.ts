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

function getBaseCookieOptions(req?: Request): Omit<CookieOptions, 'sameSite'> {
  const isProduction = process.env.NODE_ENV === 'production';
  const host = req?.get('host') || '';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

  const base: Omit<CookieOptions, 'sameSite'> = {
    httpOnly: true,
    secure: isProduction && !isLocalhost,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };

  if (isProduction) {
    return {
      ...base,
      domain: '.lumio.su',
    };
  }

  // For localhost, don't set domain to allow cookies on localhost:3000
  return base;
}

export function getStrictCookieOptions(req?: Request): CookieOptions {
  const baseOptions = getBaseCookieOptions(req);

  // For localhost, set sameSite to 'none' to allow cross-origin cookies
  // but only if secure is false (which it is for localhost)
  if (
    req?.get('host')?.includes('localhost') ||
    req?.get('host')?.includes('127.0.0.1')
  ) {
    return {
      ...baseOptions,
      sameSite: 'none',
    };
  }

  return {
    ...baseOptions,
    sameSite: 'strict',
  };
}

export function getClearCookieOptions(
  originalOptions: CookieOptions,
): CookieOptions {
  return {
    ...originalOptions,
    maxAge: 0,
  };
}
