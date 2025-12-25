import { Request } from 'express';

/**
 * Extracts client IP address from request with proper priority:
 * 1. x-forwarded-for (for production with proxy/load balancer)
 * 2. remoteAddress (for direct connections)
 * 3. fallback to 'unknown'
 */
export function getClientIp(req: Request): string {
  // Priority 1: x-forwarded-for header (for production behind proxy)
  if (req.headers['x-forwarded-for']) {
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (Array.isArray(xForwardedFor)) {
      return xForwardedFor[0] || 'unknown';
    }
    return xForwardedFor;
  }

  // Priority 2: direct connection
  if (req.socket?.remoteAddress) {
    return req.socket.remoteAddress;
  }

  // Fallback
  return 'unknown';
}

/**
 * Extracts and trims user-agent from request
 */
export function getUserAgent(req: Request): string {
  return (req.headers['user-agent'] || 'unknown').trim();
}
