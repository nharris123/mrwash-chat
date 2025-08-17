import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

import { SYSTEM_PROMPT, WELCOME } from './src/prompts.js';
import { nearestLocations, listAllLocations } from './src/tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// CORS: allow all in dev if ALLOWED_ORIGINS is blank
const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'), false);
  }
}));

// Serve static assets
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Explicit homepage
app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));

// Health check
app.get('/health', (req, res) => {
  const key = process.env.OPENAI_API_KEY || '';
  res.json({
    ok: true,
    hasKey: Boolean(key),
    keyPrefix: key ? key.slice(0, 6) : null,
    port: process.env.PORT || 8788
  });
});

// Location APIs
app.get('/api/locations', (req, res) => res.json(listAllLocations()));
app.get('/api/nearest', (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return res.status(400).json({ error: 'lat and lng required' });
  res.json(nearestLocations({ lat, lng, limit: 3 }));
});

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Non-streaming chat (simple and reliable)
app.post('/chat', async (req, res) => {
  try {
    const { messages = [] } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).send('Server misconfig: OPENAI_API_KEY is missing. Edit .env and restart.');
    }

    const rsp = await client.responses.create({
      model: 'gpt-4o-mini',
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(messages.length ? messages : [{ role: 'assistant', content: WELCOME }])
      ],
      metadata: { brand: 'Mr Wash', channel: 'web' }
    });

    const text = rsp.output_text ?? '';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(text);
  } catch (err) {
    console.error('CHAT ERROR:', err?.response?.data || err?.stack || err);
    res.status(500).send(String(err?.response?.data?.error?.message || err?.message || err));
  }
});

const PORT = process.env.PORT || 8788;
app.listen(PORT, () => console.log(`Mr Wash chat server on http://localhost:${PORT} (serving ${publicDir})`));
