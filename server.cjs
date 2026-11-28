/** Minimal dependency-free HTTP server for Railway's PORT-based deployments. */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname);
const port = Number(process.env.PORT || 3000);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8'
};
http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end();
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); return res.end(); }
  if (pathname === '/') pathname = '/index.html';
  if (/^\/demonstracao-(acaiteria|adega|corte-certo|equipes|hospedagem|lojas|petshop|restaurante)(?:\/|$)/.test(pathname)) {
    const query = new URL(req.url, 'http://localhost').search;
    res.writeHead(307, { Location: '/demonstracoes' + encodeURI(pathname) + query }); return res.end();
  }
  if (/^\/demonstracoes\/demonstracao-(acaiteria|adega|corte-certo|equipes|hospedagem|lojas|petshop|restaurante)\/?$/.test(pathname)) {
    if (!pathname.endsWith('/')) { res.writeHead(307, { Location: encodeURI(pathname) + '/' + new URL(req.url, 'http://localhost').search }); return res.end(); }
    pathname += 'index.html';
  }
  const pilotFile = /^\/demonstracoes\/demonstracao-(acaiteria|adega|corte-certo|equipes|hospedagem|lojas|petshop|restaurante)\/(?:[\w-]+\.(?:html|css|js|mjs)|src\/[\w-]+\.mjs|assets\/[\w./-]+)$/.test(pathname);
  if (pathname === "/demonstracoes" || pathname === "/demonstracoes/") pathname = "/demonstracoes/index.html";
  const hubFile = ["/demonstracoes/index.html", "/demonstracoes/hub.css", "/demonstracoes/hub.js"].includes(pathname);
  if (!pilotFile && !hubFile && !/^\/(?:index\.html|privacidade\.html|demo\.html|styles\.css|script\.js|config\.js|demo\.css|demo\.js|ambient\.css|ambient\.js|assets\/[a-zA-Z0-9_./\-]+)$/.test(pathname)) {
    res.writeHead(404); return res.end('Não encontrado');
  }
  const file = path.resolve(root, '.' + pathname);
  if (!(file === root || file.startsWith(root + path.sep))) {
    res.writeHead(403); return res.end();
  }
  fs.stat(file, (err, stats) => {
    if (err || !stats.isFile()) { res.writeHead(404); return res.end('Não encontrado'); }
    const headers = { 'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes',
      'Cache-Control': /\/assets\//.test(pathname) ? 'public, max-age=86400' : 'no-cache' };
    let start = 0, end = stats.size - 1, code = 200;
    const range = req.headers.range;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (m) {
        if (m[1] === '' && m[2] !== '') { start = Math.max(0, stats.size - Number(m[2])); }
        else { start = Number(m[1]); if (m[2]) end = Number(m[2]); }
        if (start > end || start >= stats.size || !Number.isFinite(start) || !Number.isFinite(end)) {
          res.writeHead(416, { 'Content-Range': `bytes */${stats.size}` }); return res.end();
        }
        end = Math.min(end, stats.size - 1);
        code = 206; headers['Content-Range'] = `bytes ${start}-${end}/${stats.size}`;
      }
    }
    headers['Content-Length'] = end - start + 1;
    res.writeHead(code, headers);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file, {start, end}).pipe(res);
  });
}).listen(port, '0.0.0.0', () => console.log(`Skye site listening on :${port}`));
