import { timingSafeEqual } from 'node:crypto';
import { env } from './env.js';

/** Small helpers over the Web Fetch API, so the same handlers run on Vercel and in Vite. */

/**
 * A request relayed by the site's own PHP proxy (the Reg.ru copy). Only then are the
 * X-VT-Client-IP and X-VT-Site-Host headers trusted.
 */
export function viaProxy(request: Request) {
  const key = env.proxyKey;
  const sent = request.headers.get('x-vt-proxy-key') ?? '';
  if (!key || sent.length !== key.length) return false;
  return timingSafeEqual(Buffer.from(sent), Buffer.from(key));
}

/** The host the visitor sees: the Reg.ru domain behind the proxy, otherwise this server's host. */
export function siteHost(request: Request) {
  const h = request.headers;
  if (viaProxy(request) && h.get('x-vt-site-host')) return h.get('x-vt-site-host');
  return h.get('x-forwarded-host') ?? h.get('host');
}

export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export const noContent = () => new Response(null, { status: 204 });
export const error = (code: string, status: number) => json({ error: code }, { status });

/** Best-effort client IP behind common proxies (Vercel, Cloudflare, nginx). */
export function clientIp(request: Request) {
  const h = request.headers;
  const relayed = viaProxy(request) ? h.get('x-vt-client-ip')?.trim() : '';
  if (relayed) return relayed;
  const forwarded = h.get('x-forwarded-for')?.split(',')[0]?.trim();
  return h.get('cf-connecting-ip') || h.get('x-real-ip') || forwarded || 'local';
}

export function readCookie(request: Request, name: string) {
  const header = request.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

export function cookie(
  name: string,
  value: string,
  options: { expires?: Date; httpOnly?: boolean; secure?: boolean; maxAge?: number } = {},
) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'SameSite=Lax'];
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

/** Rejects cross-site writes: when the browser sends an Origin, it must match the host. */
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === siteHost(request);
  } catch {
    return false;
  }
}

/** Parses a JSON body with a size cap; null when it is missing, too big or malformed. */
export async function readJsonBody<T>(request: Request, maxBytes = 16_000): Promise<T | null> {
  try {
    const raw = await request.text();
    if (raw.length > maxBytes) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Fixed-window rate limit kept in memory (per server instance). */
export function rateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (key: string) => {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt < now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      if (hits.size > 10_000) hits.clear();
      return false;
    }
    entry.count += 1;
    return entry.count > limit;
  };
}
