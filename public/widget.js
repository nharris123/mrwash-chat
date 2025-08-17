const body = document.getElementById('mw-body');
const form = document.getElementById('mw-form');
const input = document.getElementById('mw-input');

const history = [];
const scriptTag = document.currentScript || document.querySelector('script[src$="widget.js"]');
const API_BASE = scriptTag?.dataset?.api || ""; // "" means same-origin

let userCoords = null;
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (pos) => { userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
    () => {},
    { enableHighAccuracy: true, timeout: 5000 }
  );
}

function renderText(text) {
  const escaped = text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  return escaped.replaceAll('\n','<br>');
}
function add(role, text) {
  const row = document.createElement('div');
  row.className = 'mw-msg ' + (role === 'user' ? 'mw-you' : 'mw-assistant');
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = renderText(text);
  row.appendChild(bubble);
  body.appendChild(row);
  body.scrollTop = body.scrollHeight;
}

async function sendMessage(text) {
  add('user', text);
  history.push({ role: 'user', content: text });

  const resp = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history })
  });
  const reply = await resp.text();
  add('assistant', reply);
  history.push({ role: 'assistant', content: reply });

  if (userCoords && /nearest|near me|closest|location|locations/i.test(text)) {
    fetch(`${API_BASE}/api/nearest?lat=${userCoords.lat}&lng=${userCoords.lng}`)
      .then(r => r.json())
      .then(list => {
        if (!Array.isArray(list) || !list.length) return;
        const lines = list.map(l => `• ${l.name} — ${[l.address, l.city, l.state, l.zip].filter(Boolean).join(', ')} (${l.distance_mi} mi)`).join('\n');
        add('assistant', `Here are a few nearby locations:\n${lines}`);
      })
      .catch(()=>{});
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  await sendMessage(text);
});

window.addEventListener('load', () => {
  const greeting = document.querySelector('#mw-greeting');
  if (greeting) add('assistant', greeting.textContent);
});
