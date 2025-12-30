export const AUTH_BASE = 'auth';

export const AUTH_ROUTES = {
  REGISTRATION: 'registration',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_RECOVERY: 'password-recovery',
  NEW_PASSWORD: 'new-password',
  REGISTRATION_CONFIRMATION: 'registration-confirmation',
  YANDEX: 'yandex',
  YANDEX_CALLBACK: 'yandex/callback',
  REFRESH_TOKEN: 'refresh-token',
  ME: 'me',
} as const;

export const SECURITY_BASE = 'security/devices';

export const POSTS_BASE = 'posts';

export const POSTS_ROUTES = {
  GET_MY_POSTS: 'my',
} as const;
