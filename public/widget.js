/* API base autoconfig */
(function(){try{const s=document.currentScript||[...document.scripts].find(x=>x.src.includes("/widget.js"));const base=(window.MR_WASH_WIDGET&&window.MR_WASH_WIDGET.apiBase)||(s?new URL(s.src).origin:"");window.API_BASE=base;window.__MRW_API_BASE=base;}catch(e){}})();
(function(){
  const css = `
    #mw-chat-bubble {
      position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px;
      border-radius: 50%; background: #007bff; color: white; font-size: 30px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; z-index: 9999;
    }
    #mw-chat-box {
      position: fixed; bottom: 90px; right: 20px; width: 320px; height: 400px;
      background: white; border: 1px solid #ccc; border-radius: 10px;
      display: flex; flex-direction: column; z-index: 9999; overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    #mw-header {
      background: #007bff; color: white; padding: 10px; font-weight: bold;
    }
    #mw-messages {
      flex: 1; padding: 10px; overflow-y: auto; font-size: 14px;
    }
    #mw-input-area {
      display: flex; border-top: 1px solid #ccc;
    }
    #mw-input-area input {
      flex: 1; border: none; padding: 10px; outline: none;
    }
    #mw-input-area button {
      background: #007bff; color: white; border: none; padding: 10px 15px; cursor: pointer;
    }
  `;
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);

  // bubble
  const bubble = document.createElement("div");
  bubble.id = "mw-chat-bubble";
  bubble.textContent = "💬";
  document.body.appendChild(bubble);

  // box
  const box = document.createElement("div");
  box.id = "mw-chat-box";
  box.style.display = "none";
  box.innerHTML = `
    <div id="mw-header">Mr Wash Assistant</div>
    <div id="mw-messages"></div>
    <div id="mw-input-area">
      <input id="mw-input" placeholder="Type a message..."/>
      <button id="mw-send">Send</button>
    </div>
  `;
  document.body.appendChild(box);

  const messages = document.getElementById("mw-messages");
  function addMessage(sender, text){
    const div = document.createElement("div");
    div.textContent = sender + ": " + text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  async function send(text){
    addMessage("You", text);
    const resp = await fetch("https://mrwash-chat-3.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: text }] })
    });
    const reply = await resp.text();
    addMessage("Assistant", reply);
  }

  document.getElementById("mw-send").onclick = () => {
    const input = document.getElementById("mw-input");
    if(input.value.trim()){
      send(input.value.trim());
      input.value = "";
    }
  };
  bubble.onclick = () => {
    box.style.display = box.style.display === "none" ? "flex" : "none";
  };

  // greeting
  addMessage("Assistant", "Hi there! How can I help you today?");
})();
/* UI formatter v2: enumerated "1. 2. 3." lists */
(function mrwEnumeratedNormalizer(){ try {
  const root = document.querySelector('#mrw-widget,[data-mrw-widget],.mrw-widget') || document;
  const container = root.querySelector('.mrw-messages, [data-messages], .messages') || root;

  const toEnumList = (raw) => {
    // Find sequences like "1. Item ... 2. Item ... 3. Item ..."
    const enumRe = /(?:^|\s)(\d+)\.\s/g;
    const matches = [...raw.matchAll(enumRe)];
    if (matches.length < 3) return null; // only convert if 3+ items

    // Capture each item until the next "N. " or end
    const itemRe = /(\d+)\.\s([\s\S]*?)(?=(?:\s\d+\.\s)|$)/g;
    const items = [];
    let m;
    while ((m = itemRe.exec(raw)) !== null) {
      const text = m[2].trim().replace(/\s+/g, ' ');
      if (text) items.push(text);
    }
    if (!items.length) return null;

    // Build ordered list HTML
    const esc = s => s.replace(/[&<>]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c]));
    const asMapsLink = (t) => {
      // Add a small maps link after each line (generic, safe)
      const href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(t);
      return esc(t) + ' <a class="mrw-mini" href="'+href+'" target="_blank" rel="noopener">Map</a>';
    };
    return '<ol class="mrw-enum">' + items.map(t => '<li>'+asMapsLink(t)+'</li>').join('') + '</ol>';
  };

  const processNode = (node) => {
    const txtEl = node.querySelector?.('.mrw-text, .text, .content, [data-text]') || node;
    if (!txtEl || txtEl.querySelector('ol, ul')) return; // already formatted
    const raw = (txtEl.textContent || '').trim();
    if (!raw) return;
    const listHTML = toEnumList(raw);
    if (listHTML) {
      txtEl.innerHTML = listHTML;
    }
  };

  // Initial pass
  container.querySelectorAll('.mrw-bubble, .message, [data-role]').forEach(processNode);

  // Observe new messages
  new MutationObserver(muts => muts.forEach(m =>
    m.addedNodes.forEach(n => {
      if (n.nodeType===1) {
        if (n.matches('.mrw-bubble, .message, [data-role]')) processNode(n);
        n.querySelectorAll && n.querySelectorAll('.mrw-bubble, .message, [data-role]').forEach(processNode);
      }
    })
  )).observe(container, { subtree:true, childList:true });
} catch(e){ console.warn('mrw enumerated normalizer failed', e); } })();
/* UI formatter v2: enumerated "1. 2. 3." lists */
(function mrwEnumeratedNormalizer(){ try {
  const root = document.querySelector('#mrw-widget,[data-mrw-widget],.mrw-widget') || document;
  const container = root.querySelector('.mrw-messages, [data-messages], .messages') || root;

  const toEnumList = (raw) => {
    // Find sequences like "1. Item ... 2. Item ... 3. Item ..."
    const enumRe = /(?:^|\s)(\d+)\.\s/g;
    const matches = [...raw.matchAll(enumRe)];
    if (matches.length < 3) return null; // only convert if 3+ items

    // Capture each item until the next "N. " or end
    const itemRe = /(\d+)\.\s([\s\S]*?)(?=(?:\s\d+\.\s)|$)/g;
    const items = [];
    let m;
    while ((m = itemRe.exec(raw)) !== null) {
      const text = m[2].trim().replace(/\s+/g, ' ');
      if (text) items.push(text);
    }
    if (!items.length) return null;

    // Build ordered list HTML
    const esc = s => s.replace(/[&<>]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c]));
    const asMapsLink = (t) => {
      // Add a small maps link after each line (generic, safe)
      const href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(t);
      return esc(t) + ' <a class="mrw-mini" href="'+href+'" target="_blank" rel="noopener">Map</a>';
    };
    return '<ol class="mrw-enum">' + items.map(t => '<li>'+asMapsLink(t)+'</li>').join('') + '</ol>';
  };

  const processNode = (node) => {
    const txtEl = node.querySelector?.('.mrw-text, .text, .content, [data-text]') || node;
    if (!txtEl || txtEl.querySelector('ol, ul')) return; // already formatted
    const raw = (txtEl.textContent || '').trim();
    if (!raw) return;
    const listHTML = toEnumList(raw);
    if (listHTML) {
      txtEl.innerHTML = listHTML;
    }
  };

  // Initial pass
  container.querySelectorAll('.mrw-bubble, .message, [data-role]').forEach(processNode);

  // Observe new messages
  new MutationObserver(muts => muts.forEach(m =>
    m.addedNodes.forEach(n => {
      if (n.nodeType===1) {
        if (n.matches('.mrw-bubble, .message, [data-role]')) processNode(n);
        n.querySelectorAll && n.querySelectorAll('.mrw-bubble, .message, [data-role]').forEach(processNode);
      }
    })
  )).observe(container, { subtree:true, childList:true });
} catch(e){ console.warn('mrw enumerated normalizer failed', e); } })();
/* UI formatter v3: robust */
(function(){
  try {
    if (window.__mrwFormatterApplied) return;
    window.__mrwFormatterApplied = true;

    const esc = s => String(s||'').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    const linkify = (s) => s
      .replace(/((https?:\/\/|www\.)[^\s)]+)(?=\s|$)/gi, m => {
        const href = m.startsWith('http') ? m : 'https://' + m;
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${m}</a>`;
      })
      .replace(/(\+?\d[\d\s().-]{8,}\d)/g, m => `<a href="tel:${m.replace(/[^\d+]/g,'')}">${m}</a>`);

    function toHTML(raw) {
      const t = String(raw||'').replace(/\r\n/g, '\n').trim();
      if (!t) return '';

      // 1) Inline enumerations -> <ol>
      const itemRe = /(\d+)\.\s([\s\S]*?)(?=(?:\s\d+\.\s)|$)/g;
      const items = [];
      let m;
      while ((m = itemRe.exec(t)) !== null) {
        const text = m[2].trim().replace(/\s+/g,' ');
        if (text) items.push(text);
      }
      if (items.length >= 3) {
        const mapLink = (txt) => {
          const href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(txt);
          return esc(txt) + ' <a class="mrw-mini" href="'+href+'" target="_blank" rel="noopener">Map</a>';
        };
        return '<ol class="mrw-enum">' + items.map(x=>`<li>${mapLink(x)}</li>`).join('') + '</ol>';
      }

      // 2) Bullets (lines starting with - or •)
      const lines = t.split('\n');
      let html = '', listType = null;
      const flush = () => { if (listType) { html += listType==='ol' ? '</ol>' : '</ul>'; listType=null; } };
      for (const rawLine of lines) {
        const l = rawLine.trim();
        if (!l) { flush(); html += '<div style="height:.25rem"></div>'; continue; }
        if (/^[-•]\s+/.test(l)) {
          if (listType!=='ul') { flush(); html += '<ul class="mrw-list">'; listType='ul'; }
          html += `<li>${linkify(esc(l.replace(/^[-•]\s+/,'')))}</li>`;
        } else if (/^\d+\.\s+/.test(l)) {
          if (listType!=='ol') { flush(); html += '<ol class="mrw-enum">'; listType='ol'; }
          html += `<li>${linkify(esc(l.replace(/^\d+\.\s+/,'')))}</li>`;
        } else {
          flush();
          // Gentle sentence splitting for readability
          const chunk = l.replace(/([.!?])\s+(?=[A-Z0-9])/g, '$1\n\n');
          const paras = chunk.split(/\n{2,}/).map(p=>`<p>${linkify(esc(p))}</p>`).join('');
          html += paras;
        }
      }
      flush();
      return html;
    }

    function formatEl(el){
      try{
        if (!el || el.dataset && el.dataset.mrwFormatted) return;
        const textHost = el.querySelector?.('.mrw-text, .text, .content, [data-text]') || el;
        if (!textHost) return;
        const raw = textHost.textContent || '';
        const out = toHTML(raw);
        if (out && out !== raw) {
          textHost.innerHTML = out;
          el.dataset && (el.dataset.mrwFormatted = '1');
        }
      } catch(e){}
    }

    function scan(root){
      if (!root) return;
      // Try common message/bubble wrappers; fall back to any element with lots of sentences
      const candidates = root.querySelectorAll?.(
        '.mrw-bubble, .message, [data-role="assistant"], [data-role="bot"], .assistant, .bot, [data-text]'
      );
      if (candidates && candidates.length) {
        candidates.forEach(formatEl);
      } else if (root.textContent && /(\d+\.\s.*\d+\.\s)|(\.\s[A-Z0-9])/.test(root.textContent)) {
        formatEl(root);
      }
      // Recurse into open shadow roots
      if (root.querySelectorAll) {
        root.querySelectorAll('*').forEach(node => {
          if (node.shadowRoot) scan(node.shadowRoot);
        });
      }
    }

    // Initial pass
    scan(document);

    // Observe new messages anywhere in the page (and inside open shadow roots)
    const obs = new MutationObserver(muts => {
      muts.forEach(m => {
        m.addedNodes.forEach(n => {
          if (n.nodeType === 1) {
            scan(n);
            if (n.shadowRoot) scan(n.shadowRoot);
          }
        });
      });
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  } catch(e) {
    console.warn('mrw robust formatter failed', e);
  }
})();
