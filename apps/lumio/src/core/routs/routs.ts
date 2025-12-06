export const AUTH_BASE = 'auth/';

export const AUTH_ROUTES = {
  REGISTRATION: 'registration/',
  LOGIN: 'login/',
  LOGOUT: 'logout/',
  PASSWORD_RECOVERY: 'password-recovery/',
  NEW_PASSWORD: 'new-password/',
  GITHUB: 'github/',
  GITHUB_CALLBACK: 'github/callback/',
  GOOGLE: 'google/',
  GOOGLE_CALLBACK: 'google/callback/',
} as const;

export const SECURITY_BASE = 'security/devices/';
