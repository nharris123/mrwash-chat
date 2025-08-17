(() => {
  if (window.__MRW_WIDGET_MOUNTED__) return; // prevent double-mount
  window.__MRW_WIDGET_MOUNTED__ = true;

  const cfg = (window.MR_WASH_WIDGET || {});
  const API_BASE = cfg.apiBase || (location.origin);
  const TITLE    = cfg.title   || "Mr Wash Assistant";
  const CTA      = cfg.launcherText || "💬 Chat with Mr Wash";

  // Create DOM
  const $launcher = document.createElement('button');
  $launcher.className = 'mrw-launcher';
  $launcher.type = 'button';
  $launcher.textContent = CTA;

  const $panel = document.createElement('div');
  $panel.className = 'mrw-panel';
  $panel.innerHTML = `
    <div class="mrw-header">
      <div>
        <div class="mrw-header__title">${TITLE}</div>
        <div class="mrw-header__sub">Ask about locations, hours, prices, memberships</div>
      </div>
    </div>
    <div class="mrw-messages" id="mrwMessages"></div>
    <div class="mrw-input">
      <input id="mrwInput" type="text" placeholder="Type your question… (press Enter to send)"/>
      <button id="mrwSend" type="button">Send</button>
    </div>
  `;

  document.body.appendChild($launcher);
  document.body.appendChild($panel);

  const $messages = $panel.querySelector('#mrwMessages');
  const $input    = $panel.querySelector('#mrwInput');
  const $send     = $panel.querySelector('#mrwSend');

  $launcher.addEventListener('click', () => {
    $panel.classList.toggle('open');
    if ($panel.classList.contains('open')) $input.focus();
  });

  function scrollToBottom() { $messages.scrollTop = $messages.scrollHeight; }

  function liSafe(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function asBubbles(text, who='bot') {
    // Transform enumerated lists "1. item ..." into <ol>
    let html;
    const items = [];
    const pattern = /(?:^|\n)\s*\d{1,2}\.\s+([^\n]+)/g;
    let m;
    while ((m = pattern.exec(text)) !== null) items.push(m[1].trim());
    if (items.length >= 2) {
      const preface = text.split(/\n?\s*1\.\s+/)[0].trim();
      html = '';
      if (preface) html += `<p class="mrw-msg__text">${liSafe(preface)}</p>`;
      html += `<ol class="mrw-list">` + items.map(it => `<li>${liSafe(it)}</li>`).join('') + `</ol>`;
    } else {
      html = `<p class="mrw-msg__text">${liSafe(text)}</p>`;
    }
    const bubble = document.createElement('div');
    bubble.className = `mrw-msg ${who}`;
    bubble.innerHTML = html + `<div class="mrw-msg__meta">${who === 'user' ? 'You' : 'Assistant'}</div>`;
    $messages.appendChild(bubble);
    scrollToBottom();
  }

  async function sendMessage() {
    const msg = ($input.value || '').trim();
    if (!msg) return;
    asBubbles(msg, 'user');
    $input.value = '';
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ message: msg })
      });
      const text = await res.text(); // backend returns plain text
      asBubbles(text || 'Sorry—no response.', 'bot');
    } catch (e) {
      asBubbles('Something went wrong. Please try again.', 'bot');
    }
  }

  $send.addEventListener('click', sendMessage);
  $input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  // Greet
  asBubbles('Hi there! How can I help you today?', 'bot');
})();
