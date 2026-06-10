/**
 * PrivaShield dev proxy — port 5000 (webview)
 *
 * /api/* and /health  → FastAPI on :8000
 * everything else     → Expo Metro on :5001
 * WebSocket upgrades  → Metro on :5001 (hot-reload)
 */

const http = require('http');
const net  = require('net');

const PROXY_PORT = 5000;
const METRO_PORT = 5001;
const API_PORT   = 8000;

function isApiPath(url) {
  return (
    url === '/health' ||
    url.startsWith('/api/') ||
    url.startsWith('/docs') ||
    url.startsWith('/openapi')
  );
}

function forwardHttp(req, res, targetPort) {
  const opts = {
    hostname : '127.0.0.1',
    port     : targetPort,
    path     : req.url,
    method   : req.method,
    headers  : { ...req.headers, host: `localhost:${targetPort}` },
  };

  const proxy = http.request(opts, (upstream) => {
    res.writeHead(upstream.statusCode, upstream.headers);
    upstream.pipe(res, { end: true });
  });

  proxy.on('error', (err) => {
    if (!res.headersSent) res.writeHead(502);
    res.end(`[proxy] gateway error: ${err.message}`);
  });

  req.pipe(proxy, { end: true });
}

const server = http.createServer((req, res) => {
  forwardHttp(req, res, isApiPath(req.url) ? API_PORT : METRO_PORT);
});

// WebSocket upgrades — always go to Metro (hot-reload, Expo DevTools)
server.on('upgrade', (req, socket, head) => {
  const upstream = net.connect(METRO_PORT, '127.0.0.1', () => {
    upstream.write(
      `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n` +
      Object.entries(req.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\r\n') +
      '\r\n\r\n'
    );
    if (head && head.length) upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });
  upstream.on('error', () => socket.destroy());
  socket.on('error', () => upstream.destroy());
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`[PrivaShield Proxy] :${PROXY_PORT} ready`);
  console.log(`  /api/* → :${API_PORT} (FastAPI)`);
  console.log(`  /*     → :${METRO_PORT} (Expo Metro)`);
});
