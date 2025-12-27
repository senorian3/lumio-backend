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

/**
 * Определяет домен для кук на основе origin запроса
 */
function getCookieDomain(req?: Request): string | undefined {
  const origin = req?.get('origin') || '';
  const host = req?.get('host') || '';

  // Если запрос с localhost, но идет на продакшн бэкенд
  if (origin.includes('localhost:3000') && host.includes('lumio.su')) {
    return '.lumio.su';
  }

  // Если запрос с продакшн фронтенда
  if (origin.includes('lumio.su')) {
    return '.lumio.su';
  }

  // Если запрос локальный
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return 'localhost';
  }

  // По умолчанию для продакшна
  return '.lumio.su';
}

/**
 * Определяет secure флаг для кук
 */
function isSecureCookie(req?: Request): boolean {
  const isProduction = process.env.NODE_ENV === 'production';
  const origin = req?.get('origin') || '';

  // Для локальной разработки всегда false
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return false;
  }

  return isProduction;
}

function getBaseCookieOptions(req?: Request): Omit<CookieOptions, 'sameSite'> {
  const base: Omit<CookieOptions, 'sameSite'> = {
    httpOnly: true,
    secure: isSecureCookie(req),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };

  const domain = getCookieDomain(req);
  if (domain) {
    return {
      ...base,
      domain,
    };
  }

  return base;
}

export function getStrictCookieOptions(req?: Request): CookieOptions {
  return {
    ...getBaseCookieOptions(req),
    sameSite: 'strict',
  };
}

export function getLaxCookieOptions(req?: Request): CookieOptions {
  return {
    ...getBaseCookieOptions(req),
    sameSite: 'lax',
  };
}

export function getNoneCookieOptions(req?: Request): CookieOptions {
  return {
    ...getBaseCookieOptions(req),
    sameSite: 'none',
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
