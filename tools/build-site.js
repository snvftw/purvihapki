// Сглобява целия сайт „Малки хапки“ в папка parvi-hapki-site/ за качване в Netlify:
//   /                 представителна страница (site-src/index.html)
//   /app/             приложението (от parvi-hapki.html), работи без интернет
//   /poveritelnost/, /usloviya/, /iztochnici/   правни страници (site-src/pages/)
// Настройки (домейн, собственик, имейл): tools/site-config.json
// Стартиране: node tools/build-site.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'site-src');
const out = path.join(root, 'parvi-hapki-site');
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'site-config.json'), 'utf8'));
const siteUrl = (cfg.siteUrl || '').replace(/\/$/, '');
const now = new Date();
const VERSION = now.toISOString().slice(0, 16).replace(/[-:T]/g, '');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Попълнените стойности се показват нормално (имейлът – като линк); незаменените [..] остават оцветени
const isSet = v => v && !String(v).startsWith('[');
const fill = s => s
  .replace(/<span class="placeholder">\{\{EMAIL\}\}<\/span>/g, isSet(cfg.email) ? `<a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a>` : `<span class="placeholder">${esc(cfg.email)}</span>`)
  .replace(/<span class="placeholder">\{\{OWNER\}\}<\/span>/g, isSet(cfg.owner) ? esc(cfg.owner) : `<span class="placeholder">${esc(cfg.owner)}</span>`)
  .replace(/\{\{OWNER\}\}/g, esc(cfg.owner)).replace(/\{\{EMAIL\}\}/g, esc(cfg.email))
  .replace(/\{\{UPDATED\}\}/g, esc(cfg.updated)).replace(/\{\{YEAR\}\}/g, String(now.getFullYear()));

// Чисти старите файлове; папка, заета от друг процес (напр. отворен терминал в Windows), остава празна
const clean = dir => { if (!fs.existsSync(dir)) return; for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) { clean(p); try { fs.rmdirSync(p); } catch (err) {} } else fs.rmSync(p, { force: true }); } };
clean(out);
const write = (rel, data) => { const f = path.join(out, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };
const copy = rel => write(rel, fs.readFileSync(path.join(srcDir, rel)));

// ---------- общи файлове ----------
copy('site.css');
copy('js/qrcode.min.js');
for (const f of fs.readdirSync(path.join(srcDir, 'fonts'))) copy('fonts/' + f);
const fontFiles = fs.readdirSync(path.join(srcDir, 'fonts')).filter(f => f.endsWith('.woff2'));

// ---------- представителна страница ----------
const ogImg = (siteUrl || '') + '/icons/og-image.png';
const headMeta = [
  `<meta property="og:image" content="${ogImg}">`,
  '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
  siteUrl ? `<meta property="og:url" content="${siteUrl}/">` : '',
  siteUrl ? `<link rel="canonical" href="${siteUrl}/">` : ''
].filter(Boolean).join('\n');
write('index.html', fill(fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8')).replace('{{HEAD_META}}', headMeta));

// ---------- правни страници ----------
const pageShell = (title, desc, slug, body) => `<!doctype html>
<html lang="bg">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)} – Малки хапки</title>
<meta name="description" content="${esc(desc)}">
${siteUrl ? `<link rel="canonical" href="${siteUrl}/${slug}/">\n` : ''}<link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png">
<link rel="stylesheet" href="/fonts/fonts.css">
<link rel="stylesheet" href="/site.css">
</head>
<body>
<header class="site"><div class="wrap nav">
  <a class="logo" href="/"><img src="/icons/icon-192.png" alt="">Малки хапки</a>
  <nav class="nav-links" aria-label="Основно меню"><a class="btn primary sm" href="/app/"><span class="long">Отвори приложението</span><span class="short">Отвори</span></a></nav>
</div></header>
<main class="wrap doc">
${body}
</main>
<footer class="site"><div class="wrap">
  <div class="foot">
    <span>© ${now.getFullYear()} Малки хапки</span>
    <nav aria-label="Правна информация"><a href="/poveritelnost/">Поверителност</a><a href="/usloviya/">Общи условия</a><a href="/iztochnici/">Източници</a><a href="mailto:${esc(cfg.email)}">Контакт</a></nav>
  </div>
  <p class="disclaimer">Малки хапки помага с организацията на захранването и следва публикуваните насоки на СЗО. Не е медицинско изделие и не замества консултацията с педиатър.</p>
</div></footer>
</body>
</html>
`;
const slugs = [];
for (const f of fs.readdirSync(path.join(srcDir, 'pages'))) {
  const raw = fill(fs.readFileSync(path.join(srcDir, 'pages', f), 'utf8'));
  const title = /<!--title: (.*?)-->/.exec(raw)[1], desc = /<!--description: (.*?)-->/.exec(raw)[1];
  const slug = f.replace('.html', '');
  slugs.push(slug);
  write(slug + '/index.html', pageShell(title, desc, slug, raw.replace(/<!--.*?-->\n/g, '')));
}
write('404.html', pageShell('Страницата не е намерена', 'Страницата не е намерена.', '404',
  '<h1>Страницата не е намерена</h1><p class="updated">Може адресът да е сгрешен или страницата да е преместена.</p><p><a class="btn primary" href="/">Към началото</a> <a class="btn" href="/app/">Отвори приложението</a></p>'));

// ---------- приложението в /app/ ----------
let src = fs.readFileSync(path.join(root, 'parvi-hapki.html'), 'utf8');
src = src.replace(/<meta name="claude:viewport-fit-sides" content="cover">\r?\n/, '');
src = src.replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link rel="stylesheet" href="/fonts/fonts.css">');
if (src.includes('fonts.googleapis.com')) throw new Error('Google Fonts link still present');
const cut = src.indexOf('<header class="top">');
if (cut < 0) throw new Error('header not found');
write('app/index.html', `<!doctype html>
<html lang="bg">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Дневник за захранване на бебе по насоките на СЗО">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#F4F7F1">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#111813">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Малки хапки">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px)}body{margin:0;font-family:system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
<script>window.PH_VERSION='${VERSION}'</script>
${src.slice(0, cut)}</head>
<body>
${src.slice(cut)}<script>if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}</script>
</body>
</html>
`);
write('app/version.json', JSON.stringify({ v: VERSION }));
write('app/manifest.webmanifest', JSON.stringify({
  name: 'Малки хапки – дневник за захранване',
  short_name: 'Малки хапки',
  description: 'Дневник за захранване на бебе по насоките на СЗО',
  lang: 'bg', start_url: './', scope: './', display: 'standalone',
  background_color: '#F4F7F1', theme_color: '#2D7A55',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
}, null, 2));
write('app/sw.js', `// Малки хапки – работа без интернет (версия ${VERSION})
const CACHE = 'ph-app-${VERSION}';
const CORE = ['./', './index.html', './manifest.webmanifest', '/icons/icon-192.png', '/icons/apple-touch-icon.png', '/fonts/fonts.css', ${fontFiles.map(f => `'/fonts/${f}'`).join(', ')}];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ph-app-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (new URL(r.url).pathname.endsWith('/version.json')) return;
  // Страницата: първо от мрежата (за нови версии), без интернет – от кеша
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Иконки и шрифтове: от кеша, иначе от мрежата
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
    return res;
  })));
});
`);
// Старата версия беше на главния адрес със свой service worker – този файл го премахва при следващо посещение
write('sw.js', `// Премахва стария service worker от главния адрес (приложението вече е в /app/)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    await Promise.all(ks.filter(k => k.startsWith('parvi-hapki-')).map(k => caches.delete(k)));
    await self.registration.unregister();
  })());
});
`);

// ---------- Netlify, роботи ----------
write('_headers', `/app/sw.js
  Cache-Control: no-cache
/sw.js
  Cache-Control: no-cache
/app/*
  Cache-Control: no-cache
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), interest-cohort=()
`);
write('robots.txt', `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`);
if (siteUrl) write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['', ...slugs].map(s => `  <url><loc>${siteUrl}/${s ? s + '/' : ''}</loc></url>`).join('\n')}\n</urlset>\n`);

// ---------- иконки и картинка за споделяне (PNG, рисувани тук) ----------
const crcTable = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = buf => { let c = -1; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, pixel) {
  const raw = Buffer.alloc((w * 4 + 1) * h), SS = 3;
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const c = pixel(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS);
        r += c[0]; g += c[1]; b += c[2];
      }
      const o = y * (w * 4 + 1) + 1 + x * 4;
      raw[o] = Math.round(r / SS / SS); raw[o + 1] = Math.round(g / SS / SS); raw[o + 2] = Math.round(b / SS / SS); raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
const hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const C = { bg: hex('#2D7A55'), fruit: hex('#F0A35E'), shine: hex('#F8C894'), flesh: hex('#FFF1DC'), leaf: hex('#9ED4B3'), stem: hex('#6E4A2A') };
// „Малки хапки“: кайсия с отхапано парче (следи от зъбки), листенце и дръжка (x, y от 0 до 1); scale < 1 оставя поле за маскираните иконки
const BITES = [-28, 2, 32].map(a => [0.48 + 0.31 * Math.cos(a * Math.PI / 180), 0.56 + 0.31 * Math.sin(a * Math.PI / 180)]);
function art(x0, y0, scale) {
  const x = 0.5 + (x0 - 0.5) / scale, y = 0.5 + (y0 - 0.5) / scale;
  const a = -0.5, lx = x - 0.58, ly = y - 0.215;
  const rx = lx * Math.cos(a) - ly * Math.sin(a), ry = lx * Math.sin(a) + ly * Math.cos(a);
  if ((rx / 0.09) ** 2 + (ry / 0.042) ** 2 <= 1) return C.leaf;
  if (Math.abs(x - 0.475 - (0.29 - y) * 0.15) <= 0.016 && y >= 0.17 && y <= 0.3) return C.stem;
  const d = Math.hypot(x - 0.48, y - 0.56);
  if (d > 0.29) return C.bg;
  const bite = Math.min(...BITES.map(([bx, by]) => Math.hypot(x - bx, y - by) - 0.095));
  if (bite < 0) return C.bg;           // отхапаното
  if (bite < 0.028) return C.flesh;    // светлата плът по ръба на хапката
  if (Math.hypot(x - 0.385, y - 0.455) < 0.055) return C.shine;
  return C.fruit;
}
const icon = (size, scale) => png(size, size, (px, py) => art(px / size, py / size, scale));
write('icons/apple-touch-icon.png', icon(180, 1));
write('icons/icon-192.png', icon(192, 1));
write('icons/icon-512.png', icon(512, 1));
write('icons/icon-maskable-512.png', icon(512, 0.8));
write('icons/og-image.png', png(1200, 630, (px, py) => art(0.5 + (px - 600) / 630, py / 630, 0.9)));

console.log('Готово:', out, '| версия', VERSION, '| домейн', siteUrl || '(не е зададен)');
