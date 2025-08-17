import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

import { SYSTEM_PROMPT, WELCOME } from './src/prompts.js';
import { findNearestLocation, createSupportTicket } from './src/tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// CORS (lock down origins in production)
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

const toolSchemas = [
  {
    type: 'function',
    name: 'findNearestLocation',
    description: 'Return nearest Mr Wash location by lat/lng',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number' },
        lng: { type: 'number' }
      },
      required: ['lat','lng']
    }
  },
  {
    type: 'function',
    name: 'createSupportTicket',
    description: 'Create a human follow-up ticket with summary and contact info',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        issue: { type: 'string' }
      },
      required: ['issue']
    }
  }
];

// Stream helper: pipe token deltas to HTTP response
async function streamToHttp(stream, res) {
  stream.on('textDelta', (delta) => { res.write(delta); });
  stream.on('error', (e) => { console.error('stream error', e); });
  await stream.finalMessage(); // wait for completion
}

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { messages = [] } = req.body;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.flushHeaders?.();

    const stream = await client.responses.stream({
      model: 'gpt-4o-mini',
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(
          messages.length
            ? messages
            : [{ role: 'assistant', content: WELCOME }]
        )
      ],
      tools: toolSchemas,
      metadata: { brand: 'Mr Wash', channel: 'web' }
    });

    // Tool calls
    stream.on('toolCall', async ({ name, arguments: args, call_id }) => {
      try {
        if (name === 'findNearestLocation') {
          const result = await findNearestLocation(args || {});
          await stream.sendToolResult({ tool_call_id: call_id, result });
        } else if (name === 'createSupportTicket') {
          const result = await createSupportTicket(args || {});
          await stream.sendToolResult({ tool_call_id: call_id, result });
        } else {
          await stream.sendToolResult({ tool_call_id: call_id, result: { error: 'Unknown tool' } });
        }
      } catch (e) {
        await stream.sendToolResult({ tool_call_id: call_id, result: { error: e?.message || 'tool error' } });
      }
    });

    await streamToHttp(stream, res);
    res.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'server_error', message: err.message });
    } else {
      try {
        res.end("\\n[server error]");
      } catch (e) {
        // ignore
      }
    }
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Mr Wash chat server on http://localhost:${PORT}`));
