const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const msgs = document.getElementById('msgs');
const btn  = document.getElementById('send-btn');

// If you embed this on mrwash.com instead of the Render domain,
// set API_BASE to your full backend URL, e.g. "https://mrwash-chat-3.onrender.com"
const API_BASE = ""; // empty = same origin

function addMessage(text, who) {
  const div = document.createElement('div');
  div.className = `msg ${who}`;
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

async function sendMessage(message) {
  try {
    const r = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    addMessage(data.reply || data.error || 'No reply', 'bot');
  } catch (err) {
    console.error(err);
    addMessage('Sorry—something went wrong. Please try again.', 'bot');
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = (input.value || '').trim();
  if (!text) return;
  addMessage(text, 'me');
  input.value = '';
  input.disabled = true; btn.disabled = true;
  await sendMessage(text);
  input.disabled = false; btn.disabled = false;
  input.focus();
});
