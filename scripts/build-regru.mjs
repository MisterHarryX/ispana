/**
 * Builds the copy of the site for Reg.ru shared hosting and packs it into one ZIP.
 *
 *   npm run build:regru -- https://your-domain.ru
 *
 * - builds the site with canonical and link-preview URLs on that domain (SITE_URL);
 * - adds .htaccess (API → PHP proxy, /admin, caching, compression) and api/index.php;
 * - writes api/config.php with the proxy key from .env.production.local (PROXY_KEY),
 *   which must equal PROXY_KEY on Vercel;
 * - packs everything into regru/ispana-regru.zip — upload it to the site folder
 *   (www/<domain>/) in ispmanager and unpack it there. See deploy/regru/README.md.
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const arg = process.argv.slice(2).find((a) => a.startsWith('http'));
const siteUrl = (arg ?? '').replace(/\/$/, '');
const out = path.join(root, 'regru', 'site');
const zip = path.join(root, 'regru', 'ispana-regru.zip');

function proxyKey() {
  const file = path.join(root, '.env.production.local');
  const fromFile = existsSync(file) ? readFileSync(file, 'utf8').match(/^PROXY_KEY=(.+)$/m)?.[1]?.trim() : '';
  const key = process.env.PROXY_KEY || fromFile;
  if (!key) {
    console.error('PROXY_KEY не найден: добавьте его в .env.production.local (тот же, что на Vercel).');
    process.exit(1);
  }
  return key;
}

const key = proxyKey();
console.log(siteUrl ? `Сборка для ${siteUrl}` : 'Сборка без домена: канонический адрес останется на Vercel');
execSync('npx tsc', { cwd: root, stdio: 'inherit' });
execSync('npx vite build', { cwd: root, stdio: 'inherit', env: { ...process.env, ...(siteUrl ? { SITE_URL: siteUrl } : {}) } });

rmSync(path.join(root, 'regru'), { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(path.join(root, 'dist'), out, { recursive: true });
const tpl = path.join(root, 'deploy', 'regru');
let htaccess = readFileSync(path.join(tpl, '.htaccess'), 'utf8');
// One address for people and link previews: with a www. site URL the bare domain redirects to it.
const host = siteUrl ? new URL(siteUrl).hostname : '';
if (host.startsWith('www.')) {
  const bare = host.slice(4).replace(/\./g, '\\.');
  htaccess = htaccess.replace(
    '  RewriteEngine On\n',
    `  RewriteEngine On\n\n  # ${host.slice(4)} → ${host}: one canonical address.\n  RewriteCond %{HTTP_HOST} ^${bare}$ [NC]\n  RewriteRule ^(.*)$ https://${host}/$1 [R=301,L]\n`,
  );
}
writeFileSync(path.join(out, '.htaccess'), htaccess);
cpSync(path.join(tpl, 'assets', '.htaccess'), path.join(out, 'assets', '.htaccess'));
mkdirSync(path.join(out, 'api'), { recursive: true });
cpSync(path.join(tpl, 'api', 'index.php'), path.join(out, 'api', 'index.php'));
cpSync(path.join(tpl, 'api', '.htaccess'), path.join(out, 'api', '.htaccess'));
const config = readFileSync(path.join(tpl, 'api', 'config.example.php'), 'utf8').replace('__PROXY_KEY__', key);
writeFileSync(path.join(out, 'api', 'config.php'), config);
// The upload instructions go next to the archive (not inside the site).
cpSync(path.join(tpl, 'README.md'), path.join(root, 'regru', 'ИНСТРУКЦИЯ.md'));
// The photo credits and other notes are not for the web.
rmSync(path.join(out, 'photos', 'CREDITS.md'), { force: true });

// Zip the contents (not the folder), dotfiles included, with forward slashes in paths:
// Reg.ru unpacks on Linux, and PowerShell's own zipper writes backslashes there.
if (process.platform === 'win32') {
  const tar = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe');
  execSync(`"${tar}" -a -c -f "${zip}" -C "${out}" .`, { stdio: 'inherit' });
} else {
  execSync(`cd "${out}" && zip -qr "${zip}" .`, { stdio: 'inherit', shell: '/bin/sh' });
}
console.log(`\nГотово: ${path.relative(root, zip)}`);
