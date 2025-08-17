import 'dotenv/config';
import express from 'express';

const app = express();

app.get('/health', (req, res) => {
  res.json({ ok: true, msg: 'health ok', port: process.env.PORT || 8787 });
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`TEST server on http://localhost:${PORT}`));
