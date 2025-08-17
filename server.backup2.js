import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

import { SYSTEM_PROMPT, WELCOME } from './src/prompts.js';

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

// Serve demo widget
app.use(express.static(path.join(__dirname, 'public')));

// Simple health check to verify env + server
app.get('/health', (req, res) => {
  const key = process.env.OPENAI_API_KEY || '';
  res.json({
    ok: true,
    hasKey: Boolean(key),
    keyPrefix: key ? key.slice(0, 6) : null,
    port: process.env.PORT || 8787
  });
});

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Non-streaming /chat endpoint (plain text response)
app.post('/chat', async (req, res) => {
  try {
    const { messages = [] } = req.body;

    // Quick sanity checks
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).send('Server misconfig: OPENAI_API_KEY is missing.\nEdit .env and restart.');
    }

    const rsp = await client.responses.create({
      model: 'gpt-4o-mini',
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(messages.length ? messages : [{ role: 'assistant', content: WELCOME }])
      ],
      // Keep minimal for now
      metadata: { brand: 'Mr Wash', channel: 'web' }
    });

    const text = rsp.output_text ?? '';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(text);
  } catch (err) {
    // Show the exact error to both console and client during debugging
    console.error('CHAT ERROR:', err?.response?.data || err?.stack || err);
    res.status(500).send(String(err?.response?.data?.error?.message || err?.message || err));
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Mr Wash chat server on http://localhost:${PORT}`));
