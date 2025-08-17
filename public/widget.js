// Singleton guard
if (!window.__mrwash_widget__) {
  window.__mrwash_widget__ = true;

  const API_BASE = ""; // same origin; set to full URL if embedding on mrwash.com

  const style = document.createElement('style');
  style.textContent = `
  .mw-launcher { position: fixed; right: 24px; bottom: 24px; z-index: 9999;
    background: #2563eb; color: #fff; border-radius: 999px; padding: 14px 18px; 
    font-weight: 700; box-shadow: 0 8px 24px rgba(0,0,0,.18); cursor: pointer; border: 0; }
  .mw-panel { position: fixed; right: 24px; bottom: 24px; width: 380px; max-width: calc(100vw - 32px);
    height: 520px; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; 
    box-shadow: 0 20px 60px rgba(0,0,0,.18); display: none; flex-direction: column; overflow: hidden; z-index: 10000; }
  .mw-panel.open { display: flex; }
  .mw-header { background: #0f1a2b; color: #fff; padding: 14px 16px; font-weight: 700; }
  .mw-msgs { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
  .mw-msg { max-width: 75%; padding: 10px 12px; border-radius: 12px; line-height: 1.35; white-space: pre-wrap; }
  .mw-me { align-self: flex-end; background: #2563eb; color: #fff; border-bottom-right-radius: 4px; }
  .mw-bot { align-self: flex-start; background: #f3f4f6; color: #111827; border-bottom-left-radius: 4px; }
  .mw-form { display: flex; gap: 8px; padding: 12px; border-top: 1px solid #e5e7eb; background: #fff; }
  .mw-input { flex: 1; border: 1px solid #d1d5db; border-radius: 999px; padding: 12px 14px; font-size: 15px; outline: none; }
  .mw-send { border: 0; border-radius: 999px; padding: 12px 16px; font-weight: 700; background: #2563eb; color: #fff; cursor: pointer; }
  @media (max-width: 420px){ .mw-panel{right: 12px; bottom: 12px; width: calc(100vw - 24px); height: 70vh;} }
  `;
  document.head.appendChild(style);

  const launcher = document.createElement('button');
  launcher.className = 'mw-launcher';
  launcher.type = 'button';
  launcher.textContent = '💬 Chat with Mr Wash';

  const panel = document.createElement('div');
  panel.className = 'mw-panel';
  panel.innerHTML = `
    <div class="mw-header">Mr Wash Assistant</div>
    <div class="mw-msgs" id="mw-msgs">
      <div class="mw-msg mw-bot">Ask about hours, memberships, cancellations, or the nearest location.</div>
    </div>
    <form class="mw-form" id="mw-form" autocomplete="off">
      <input class="mw-input" id="mw-input" type="text" placeholder="Type your message…" />
      <button class="mw-send" id="mw-send" type="submit">Send</button>
    </form>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  const msgs  = panel.querySelector('#mw-msgs');
  const form  = panel.querySelector('#mw-form');
  const input = panel.querySelector('#mw-input');

  function addMsg(text, who){
    const d = document.createElement('div');
    d.className = `mw-msg ${who==='me'?'mw-me':'mw-bot'}`;
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  async function sendChat(message){
    try {
      const r = await fetch(`${API_BASE}/chat`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message })
      });
      const j = await r.json();
      addMsg(j.reply || j.error || 'No reply', 'bot');
    } catch (e) {
      console.error(e);
      addMsg('Sorry—something went wrong. Please try again.', 'bot');
    }
  }

  launcher.addEventListener('click', () => {
    panel.classList.add('open');
    launcher.style.display = 'none';          // <<< HIDE launcher when open
    setTimeout(() => input.focus(), 50);
  });

  // Clicking outside (Esc) closes panel and shows launcher again
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      panel.classList.remove('open');
      launcher.style.display = 'inline-block';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = (input.value || '').trim();
    if (!text) return;
    addMsg(text, 'me');
    input.value = '';
    input.disabled = true;
    panel.querySelector('#mw-send').disabled = true;
    await sendChat(text);
    input.disabled = false;
    panel.querySelector('#mw-send').disabled = false;
    input.focus();
  });
}
