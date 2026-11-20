import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Inline Vite's bundled JavaScript and CSS so the game also runs over file://.
// The game has no runtime downloads, external assets or API requests.
let html = await readFile('dist/index.html', 'utf8');
const resolveAsset = url => path.join('dist', url.replace(/^\.\//, ''));
const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)];
if (scripts.length !== 1) throw new Error('Expected one bundled entry script');
for (const match of scripts) {
  const code = await readFile(resolveAsset(match[1]), 'utf8');
  html = html.replace(match[0], () => `<script type="module">${code.replace(/<\/script/gi, '<\\/script')}</script>`);
}
for (const match of [...html.matchAll(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g)]) {
  const css = await readFile(resolveAsset(match[1]), 'utf8');
  html = html.replace(match[0], () => `<style>${css}</style>`);
}
if (/<(?:script|link)\b[^>]*(?:src|href)="(?:\.\/|\/)/.test(html)) {
  throw new Error('An external bundle reference remains');
}
await mkdir('release', { recursive: true });
await writeFile('release/Pacific-Drive-Navigateur.html', html);
console.log('Version autonome : release/Pacific-Drive-Navigateur.html');
