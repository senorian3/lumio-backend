import { Request } from 'express';
import {
  getCookieDomain,
  isSecureCookie,
  getNoneCookieOptions,
  getStrictCookieOptions,
  getLaxCookieOptions,
} from './cookie.helper';

describe('Cookie Helper', () => {
  describe('getCookieDomain', () => {
    it('should return .lumio.su for localhost:3000 origin with lumio.su host', () => {
      const req = {
        get: (header: string) => {
          if (header === 'origin') return 'http://localhost:3000';
          if (header === 'host') return 'lumio.su';
          return '';
        },
      } as Request;

      const domain = getCookieDomain(req);
      expect(domain).toBe('.lumio.su');
    });

    it('should return lumio.su for lumio.su origin', () => {
      const req = {
        get: (header: string) => {
          if (header === 'origin') return 'https://lumio.su';
          return '';
        },
      } as Request;

      const domain = getCookieDomain(req);
      expect(domain).toBe('.lumio.su');
    });

    it('should return localhost for localhost origin', () => {
      const req = {
        get: (header: string) => {
          if (header === 'origin') return 'http://localhost:3000';
          return '';
        },
      } as Request;

      const domain = getCookieDomain(req);
      expect(domain).toBe('localhost');
    });
  });

  describe('isSecureCookie', () => {
    it('should return false for localhost origin', () => {
      const req = {
        get: (header: string) => {
          if (header === 'origin') return 'http://localhost:3000';
          return '';
        },
      } as Request;

      const secure = isSecureCookie(req);
      expect(secure).toBe(false);
    });

    it('should return true for lumio.su origin in production', () => {
      process.env.NODE_ENV = 'production';
      const req = {
        get: (header: string) => {
          if (header === 'origin') return 'https://lumio.su';
          return '';
        },
      } as Request;

      const secure = isSecureCookie(req);
      expect(secure).toBe(true);
    });
  });

  describe('getNoneCookieOptions', () => {
    it('should always return secure: true for sameSite: none', () => {
      const req = {
        get: (header: string) => {
          if (header === 'origin') return 'http://localhost:3000';
          return '';
        },
      } as Request;

      const options = getNoneCookieOptions(req);
      expect(options.secure).toBe(true);
      expect(options.sameSite).toBe('none');
    });

    it('should return correct domain for localhost:3000 origin with lumio.su host', () => {
      const req = {
        get: (header: string) => {
          if (header === 'origin') return 'http://localhost:3000';
          if (header === 'host') return 'lumio.su';
          return '';
        },
      } as Request;

      const options = getNoneCookieOptions(req);
      expect(options.domain).toBe('.lumio.su');
      expect(options.secure).toBe(true);
    });
  });

  describe('getStrictCookieOptions', () => {
    it('should return secure: false for localhost origin', () => {
      const req = {
        get: (header: string) => {
          if (header === 'origin') return 'http://localhost:3000';
          return '';
        },
      } as Request;

      const options = getStrictCookieOptions(req);
      expect(options.secure).toBe(false);
      expect(options.sameSite).toBe('strict');
    });
  });

  describe('getLaxCookieOptions', () => {
    it('should return secure: false for localhost origin', () => {
      const req = {
        get: (header: string) => {
          if (header === 'origin') return 'http://localhost:3000';
          return '';
        },
      } as Request;

      const options = getLaxCookieOptions(req);
      expect(options.secure).toBe(false);
      expect(options.sameSite).toBe('lax');
    });
  });
});
