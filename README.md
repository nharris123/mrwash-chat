# Mr Wash GPT Chat — Starter

A drop-in live chat for your website, powered by OpenAI’s Responses API (streaming) with tool hooks
for human handoff and nearest-location lookup. Front-end is a tiny widget; backend is Node/Express.

## Quick start

1) **Clone & install**  
```bash
npm install
cp .env.example .env
# Put your OpenAI API key into .env (OPENAI_API_KEY)
```

2) **Run locally**  
```bash
npm start
# Opens on http://localhost:8787
# Demo widget is served from / (public/index.html).
```

3) **Embed on your site**  
Copy the contents of `public/` (or inline `widget.css` and `widget.js`) into your site.  
Point the widget’s fetch URL to your deployed `/chat` endpoint.

## Customization

- **Prompt**: `src/prompts.js` contains the system instructions (hours 8 AM–8 PM, 11 locations, memberships, cancellation policy).  
- **Tools**: `src/tools.js` has two example tools:
  - `findNearestLocation(lat, lng)` — mock nearest-site finder. Replace `LOCATIONS` with your real data.
  - `createSupportTicket({ name, email, phone, issue })` — mock ticket creation. Hook to Zendesk/HubSpot/etc.
- **Styling**: tweak `public/widget.css` to match Mr Wash branding.
- **Greeting**: set a custom welcome text in `src/prompts.js` or via a first assistant message.

## Production notes

- **Security**: Never expose `OPENAI_API_KEY` client-side. This server mediates chat requests. Lock down CORS.
- **PII**: Don’t collect full card numbers or sensitive data. Escalate to a human for billing changes.
- **Observability**: Add structured logs and redact sensitive strings.
- **Rate limits**: Cache or debounce repeated questions (e.g., hours) to save tokens.
- **Models**: Default is `gpt-4o-mini` for cost/latency. You can swap to larger models as needed.

## Deployment

You can deploy the Node server to most platforms:
- **Vercel**: Use a Node server deployment (or port this to serverless functions).
- **Render/Fly/Heroku**: Deploy a long-running Node app; set env vars (OPENAI_API_KEY, ALLOWED_ORIGINS, PORT).

## FAQ grounding

`src/faq.json` includes seed content the prompt can rely on. For larger corpora (policies, PDFs), you can add retrieval using
OpenAI’s libraries or your own vector DB. The minimal starter keeps it simple and safe.

## License

MIT — use freely at Mr Wash.
