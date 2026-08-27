import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 3000;

/* ---- simple .env loader (no dependencies) ---- */
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  for (const rawLine of envFile.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (k && !process.env[k]) process.env[k] = v;
  }
} catch {
  /* no .env file, ignore */
}

const PROVIDERS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    envKey: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o-mini',
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    envKey: 'GROQ_API_KEY',
    defaultModel: 'openai/gpt-oss-120b',
  },
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  // Prevent path traversal
  const filePath = path.normalize(path.join(PUBLIC_DIR, urlPath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
}

function readJsonBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      body += c;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

async function handleChat(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    return sendJson(res, 400, { error: 'Requisição inválida.' });
  }

  const providerName = (body.provider || 'groq').trim().toLowerCase();
  const provider = PROVIDERS[providerName] || PROVIDERS.groq;
  const apiKey = (body.apiKey || '').trim() || (process.env[provider.envKey] || '').trim();
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const model = (body.model || provider.defaultModel).trim();
  const temperature = Number.isFinite(body.temperature) ? body.temperature : 0.7;

  if (!apiKey) {
    return sendJson(res, 400, {
      error: providerName === 'openai'
        ? 'Configure sua OpenAI API key nas configurações (ícone de engrenagem).'
        : 'Configure sua Groq API key nas configurações (ícone de engrenagem) ou no arquivo .env.',
    });
  }
  if (messages.length === 0) {
    return sendJson(res, 400, { error: 'Nenhuma mensagem para processar.' });
  }

  let upstream;
  try {
    upstream = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream: true,
      }),
    });
  } catch (err) {
    // Network / DNS / TLS failure — the OpenAI/Groq endpoint could not be reached.
    return sendJson(res, 503, {
      error: 'Não foi possível conectar ao provedor de IA. Verifique se este ambiente tem acesso à internet, ou rode o JARVIS localmente.',
    });
  }

  if (!upstream.ok) {
    // Try to extract a meaningful error message from OpenAI
    let message = `Erro da API (status ${upstream.status}).`;
    try {
      const err = await upstream.json();
      message = err?.error?.message || message;
    } catch {
      /* ignore */
    }
    if (upstream.status === 401) {
      message = 'API key inválida ou expirada. Verifique nas configurações.';
    }
    return sendJson(res, 502, { error: message });
  }

  // Stream via Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  const sendEvent = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);

        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;

        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta?.content || '';
          if (delta) sendEvent({ delta });
        } catch {
          /* ignore partial line */
        }
      }
    }
    sendEvent({ done: true });
    res.write('data: [DONE]\n\n');
  } catch (e) {
    sendEvent({ error: 'Falha de conexão com a API.' });
  } finally {
    res.end();
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.startsWith('/api/chat')) {
    handleChat(req, res);
    return;
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    sendJson(res, 200, { ok: true, time: new Date().toISOString() });
    return;
  }

  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405);
  res.end('Method Not Allowed');
});

function openBrowser(url) {
  if (process.env.JARVIS_NO_OPEN) return;
  let cmd;
  if (process.platform === 'win32') cmd = `start "" "${url}"`;
  else if (process.platform === 'darwin') cmd = `open "${url}"`;
  else cmd = `xdg-open "${url}"`;
  exec(cmd, () => {});
}

server.listen(PORT, '0.0.0.0', () => {
  const url = `http://localhost:${PORT}`;
  console.log(`JARVIS online em ${url}`);
  openBrowser(url);
});
