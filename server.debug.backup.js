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

// --- CORS: allow all in dev if ALLOWED_ORIGINS not set ---
const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'), false);
  }
}));

// Serve demo widget
app.use(express.static(path.join(__dirname, 'public')));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Non-streaming /chat endpoint for reliability while we debug
app.post('/chat', async (req, res) => {
  try {
    const { messages = [] } = req.body;

    const rsp = await client.responses.create({
      model: 'gpt-4o-mini',
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(messages.length ? messages : [{ role: 'assistant', content: WELCOME }])
      ],
      // NOTE: no tools for now to keep it simple
      metadata: { brand: 'Mr Wash', channel: 'web' }
    });

    const text = rsp.output_text ?? '';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(text);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'server_error', message: err.message });
    }
    try { return res.end("\n[server error]"); } catch {}
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Mr Wash chat server on http://localhost:${PORT}`));
