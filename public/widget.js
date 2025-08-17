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
