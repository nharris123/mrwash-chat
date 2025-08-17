import 'dotenv/config';
import express from 'express';
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

import { SYSTEM_PROMPT, WELCOME } from './src/prompts.js';
import { nearestLocations, listAllLocations } from './src/tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: (process.env.ALLOWED_ORIGINS||"*").split(",").map(s=>s.trim()), credentials: true }));
app.get("/healthz", (req, res) => res.json({ ok: true }));
app.get("/version", (req, res) => res.json({
  sha: process.env.RENDER_GIT_COMMIT || "dev",
  env: process.env.MRWASH_ENV || "production"
}));app.get("/healthz", (req, res) => res.json({ ok: true }));
app.use(express.json());

// CORS (allow all in dev if ALLOWED_ORIGINS is blank)
const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'), false);
  }
}));

// Static site
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));

// Debug/location APIs
app.get('/api/locations', (req, res) => res.json(listAllLocations()));
app.get('/api/nearest', (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return res.status(400).json({ error: 'lat and lng required' });
  res.json(nearestLocations({ lat, lng, limit: 3 }));
});

// Health
app.get('/health', (req, res) => {
  const key = process.env.OPENAI_API_KEY || '';
  res.json({ ok: true, hasKey: Boolean(key), keyPrefix: key ? key.slice(0, 6) : null, port: process.env.PORT || 8788 });
});

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper to format the authoritative list for the model
function locationsAsLines() {
  const rows = listAllLocations();
  const line = (l) => {
    const parts = [l.address, l.city, l.state, l.zip].filter(Boolean);
    return `${l.name} — ${parts.join(', ')}`.replace(/\s+,/g, ',').trim();
  };
  return rows.map(line).join('\n');
}

// Chat (inject the list so the model can't invent locations)
app.post('/chat', async (req, res) => {
  try {
    const { messages = [] } = req.body;
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).send('Server misconfig: OPENAI_API_KEY is missing. Edit .env and restart.');
    }

    const LOCATIONS_BLOCK = `Authoritative Mr Wash locations (use ONLY these; do not invent or add others):
${locationsAsLines()}
If asked to list locations, list from the above. If asked for "nearest", you may ask for ZIP/city or rely on /api/nearest if coordinates are provided.`;

    const rsp = await client.responses.create({
      model: 'gpt-4o-mini',
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: LOCATIONS_BLOCK },
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

app.get("/healthz", (req, res) => res.json({ ok: true }));

// Version endpoint (Render sets RENDER_GIT_COMMIT)
app.get("/version", (req, res) => {
  res.json({
    sha: process.env.RENDER_GIT_COMMIT || "dev",
    env: process.env.MRWASH_ENV || "production"
  });
});

// --- Smart, deterministic answers for common intents ---
app.post("/smartchat", async (req, res) => {
  try {
    const msg = (req.body?.message || "").toString();
    const q = msg.trim().toLowerCase();

    // Load locations on-demand (no top-level import needed)
    const { LOCATIONS_LIST_TEXT } = await import("./data/locations.js");

    // Simple intent checks
    const wantsLocations = /\b(location|locations|store|stores|where.*(location|store))\b/.test(q);
    const wantsHours     = /\b(hour|hours|open|close|opening|closing)\b/.test(q);

    if (wantsLocations) {
      return res.type("text/plain").send(LOCATIONS_LIST_TEXT);
    }

    if (wantsHours) {
      const hours =
        "All Mr Wash locations are open daily from 8 AM to 8 PM. " +
        "Holiday hours may vary by location. Share your ZIP code if you want the closest location’s details.";
      return res.type("text/plain").send(hours);
    }

    // Fallback: delegate to your existing /chat route so nothing else breaks
    const port = process.env.PORT || 10000;
    const r = await fetch(`http://127.0.0.1:${port}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });
    const t = await r.text();
    return res.type("text/plain").send(t || "I’m here to help with locations, hours, memberships, and pricing.");
  } catch (e) {
    console.error("smartchat error", e);
    return res.type("text/plain").send("Sorry—something went wrong. Try asking about locations or hours.");
  }
});
