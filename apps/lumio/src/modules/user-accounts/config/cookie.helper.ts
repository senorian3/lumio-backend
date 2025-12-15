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

  return base;
}

export function getLoginCookieOptions(req?: Request): CookieOptions {
  return {
    ...getBaseCookieOptions(req),
    sameSite: 'strict',
  };
}

export function getOAuthCookieOptions(req?: Request): CookieOptions {
  return {
    ...getBaseCookieOptions(req),
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
