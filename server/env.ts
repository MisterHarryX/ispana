import path from 'node:path';

/**
 * Server settings, all from environment variables (see .env.example).
 * Read lazily: in development Vite loads .env files into process.env after import.
 */
export const env = {
  get adminPassword() {
    return process.env.ADMIN_PASSWORD ?? '';
  },
  /** Signs session cookies; falls back to a value derived from the password. */
  get adminSecret() {
    return process.env.ADMIN_SECRET || (this.adminPassword ? `isp:${this.adminPassword}` : '');
  },
  /** The reader's time zone: days, slots and statistics are cut in it. */
  get tz() {
    return process.env.ADMIN_TZ || 'Europe/Moscow';
  },
  /** Folder for requests, analytics and edits when there is no Redis (default `.data`). */
  get dataDir() {
    return path.resolve(process.env.VT_DATA_DIR || path.join(process.cwd(), '.data'));
  },
  get redisUrl() {
    return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  },
  get redisToken() {
    return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  },
  /**
   * Shared secret of the PHP proxy on the Reg.ru copy of the site (deploy/regru/api/config.php).
   * Requests carrying it may name the visitor's IP and the site host; empty disables the proxy.
   */
  get proxyKey() {
    return process.env.PROXY_KEY ?? '';
  },
  get onVercel() {
    return Boolean(process.env.VERCEL);
  },
  get production() {
    return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  },
};

export const adminConfigured = () => env.adminPassword.length > 0;
