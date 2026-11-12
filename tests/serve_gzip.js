// Statischer Server mit gzip wie GitHub Pages – nur für Lighthouse-Messungen: node tests/serve_gzip.js [port]
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = path.join(__dirname, '..'), TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };
http.createServer((q, s) => {
  let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT)) return s.writeHead(403).end();
  if (f.endsWith(path.sep)) f += 'index.html';
  fs.readFile(f, (e, d) => {
    if (e) return s.writeHead(404).end();
    const t = TYPES[path.extname(f)] || 'application/octet-stream', gz = /text|json|svg|manifest/.test(t) && /gzip/.test(q.headers['accept-encoding'] || '');
    s.writeHead(200, { 'Content-Type': t, 'Cache-Control': 'max-age=600', ...(gz ? { 'Content-Encoding': 'gzip' } : {}) }); s.end(gz ? zlib.gzipSync(d) : d);
  });
}).listen(+process.argv[2] || 8001);
