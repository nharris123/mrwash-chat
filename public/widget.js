/**
 * Mr Wash chat widget – self-rendering version.
 * It builds the chat UI inside <div id="mrwash-assistant"></div>
 * and talks to the backend at API_BASE (/chat, /api/nearest, etc).
 */

const mount = document.getElementById('mrwash-assistant');
if (!mount) {
  console.error('[MrWash] mount #mrwash-assistant not found');
}

// Determine API base from the <script ... data-api="..."> that loaded this file.
const currentScript = document.currentScript || document.querySelector('script[src*="widget.js"]');
const API_BASE = currentScript?.dataset?.api || "";

// Build minimal UI if not present
if (mount && !mount.querySelector('#mw-body')) {
  mount.innerHTML = `
    <div class="mw-chat" style="display:flex;flex-direction:column;height:100%;background:#fff;border-radius:12px;overflow:hidden">
      <div class="mw-header" style="padding:10px 12px;background:#0c64d6;color:#fff;font-weight:600">Mr Wash Assistant</div>
      <div id="mw-body" class="mw-body" style="flex:1;overflow:auto;padding:10px;background:#f6f8fb"></div>
      <form id="mw-form" class="mw-form" style="display:flex;gap:8px;padding:10px;background:#fff;border-top:1px solid #e5e7eb">
        <input id="mw-input" class="mw-input" type="text" placeholder="Type your message…" style="flex:1;padding:10px;border:1px solid #d1d5db;border-radius:8px" />
        <button type="submit" class="mw-send" style="padding:10px 14px;border:none;border-radius:8px;background:#0c64d6;color:#fff;font-weight:600;cursor:pointer">Send</button>
      </form>
      <div id="mw-greeting" style="display:none">Hi there! 👋 I can help with hours, memberships, cancellations, and finding your nearest location.</div>
    </div>
  `;
}

// Hook elements
const bodyEl = mount?.querySelector('#mw-body');
const formEl = mount?.querySelector('#mw-form');
const inputEl = mount?.querySelector('#mw-input');

const history = []; // [{role:'user'|'assistant', content:'...'}]

// Optional: get coords for "nearest"
let userCoords = null;
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (pos) => { userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
    () => {},
    { enableHighAccuracy: true, timeout: 5000 }
  );
}

// Render helpers
function escapeHTML(s){return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
function renderText(text){return escapeHTML(text).replaceAll('\n','<br>');}

function add(role, text) {
  if (!bodyEl) return;
  const row = document.createElement('div');
  row.className = 'mw-msg ' + (role === 'user' ? 'mw-you' : 'mw-assistant');
  row.style.margin = '6px 0';
  row.style.display = 'flex';
  row.style.justifyContent = role === 'user' ? 'flex-end' : 'flex-start';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.style.maxWidth = '80%';
  bubble.style.padding = '10px 12px';
  bubble.style.borderRadius = '10px';
  bubble.style.whiteSpace = 'pre-wrap';
  bubble.style.background = role === 'user' ? '#e5f0ff' : '#fff';
  bubble.style.border = '1px solid #e5e7eb';
  bubble.innerHTML = renderText(text);

  row.appendChild(bubble);
  bodyEl.appendChild(row);
  bodyEl.scrollTop = bodyEl.scrollHeight;
  return bubble;
}

async function sendMessage(text) {
  add('user', text);
  history.push({ role: 'user', content: text });

  let reply = '[server error]';
  try {
    const resp = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history })
    });
    reply = await resp.text();
  } catch (e) {
    reply = '[network error]';
  }

  add('assistant', reply);
  history.push({ role: 'assistant', content: reply });

  // If user asked about nearest, try helper
  if (userCoords && /nearest|near me|closest|location|locations/i.test(text)) {
    fetch(`${API_BASE}/api/nearest?lat=${userCoords.lat}&lng=${userCoords.lng}`)
      .then(r => r.json())
      .then(list => {
        if (!Array.isArray(list) || !list.length) return;
        const lines = list.map(l => `• ${l.name} — ${[l.address,l.city,l.state,l.zip].filter(Boolean).join(', ')} (${l.distance_mi} mi)`).join('\n');
        add('assistant', `Here are a few nearby locations:\n${lines}`);
      }).catch(()=>{});
  }
}

if (formEl && inputEl) {
  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    await sendMessage(text);
  });
}

// Greet on load
const greeting = mount?.querySelector('#mw-greeting');
if (greeting) add('assistant', greeting.textContent || greeting.innerText || '');
