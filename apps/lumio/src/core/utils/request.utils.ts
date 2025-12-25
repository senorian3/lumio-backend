import { Request } from 'express';
export function getClientIp(req: Request): string {
  if (req.headers['x-forwarded-for']) {
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (Array.isArray(xForwardedFor)) {
      return xForwardedFor[0] || 'unknown';
    }
    return xForwardedFor;
  }

  if (req.socket?.remoteAddress) {
    return req.socket.remoteAddress;
  }

  return 'unknown';
}

export function getUserAgent(req: Request): string {
  return (req.headers['user-agent'] || 'unknown').trim();
}
