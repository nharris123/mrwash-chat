const body = document.getElementById('mw-body');
const form = document.getElementById('mw-form');
const input = document.getElementById('mw-input');

const history = []; // [{role:'user'|'assistant', content:'...'}]

// Optional: request location (so we can suggest nearest)
let userCoords = null;
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (pos) => { userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
    () => {}, // ignore if declined
    { enableHighAccuracy: true, timeout: 5000 }
  );
}

// Escape text to avoid HTML injection, then preserve newlines
function renderText(text) {
  const escaped = text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  return escaped.replaceAll('\n', '<br>');
}

function add(role, text) {
  const row = document.createElement('div');
  row.className = 'mw-msg ' + (role === 'user' ? 'mw-you' : 'mw-assistant');
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = renderText(text); // keep line breaks
  row.appendChild(bubble);
  body.appendChild(row);
  body.scrollTop = body.scrollHeight;
  return bubble;
}

async function sendMessage(text) {
  add('user', text);
  history.push({ role: 'user', content: text });

  const resp = await fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history })
  });

  const reply = await resp.text();
  add('assistant', reply);
  history.push({ role: 'assistant', content: reply });

  // lightweight auto-suggest for nearest if user asked
  if (userCoords && /nearest|near me|closest|location|locations/i.test(text)) {
    fetch(`/api/nearest?lat=${userCoords.lat}&lng=${userCoords.lng}`)
      .then(r => r.json())
      .then(list => {
        if (!Array.isArray(list) || !list.length) return;
        const lines = list.map(l => `• ${l.name} — ${[l.address, l.city, l.state, l.zip].filter(Boolean).join(', ')} (${l.distance_mi} mi)`).join('\n');
        add('assistant', `Here are a few nearby locations:\n${lines}`);
      })
      .catch(() => {});
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
