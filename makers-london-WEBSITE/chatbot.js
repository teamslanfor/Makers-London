/* Makers London – scripted chat assistant (no AI service, no dependencies). */
(function () {
  'use strict';
  const S = window.SITE || {};
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const css = `
  .lt-btn{position:fixed;right:18px;bottom:18px;z-index:70;display:flex;align-items:center;gap:10px;padding:8px 20px 8px 8px;border:0;border-radius:999px;background:#1f3a6e;color:#fff;font:800 .95rem 'Cormorant',Georgia,serif;cursor:pointer;box-shadow:0 14px 30px -12px rgba(31,58,110,.6);transition:transform .35s cubic-bezier(.22,.7,.2,1),box-shadow .35s}
  .lt-btn:hover{transform:translateY(-3px);box-shadow:0 18px 34px -12px rgba(31,58,110,.7)}
  .lt-btn i{width:40px;height:40px;border-radius:50%;background:#f6e7b8;display:grid;place-items:center;font-style:normal;font-size:1.3rem}
  .lt-panel{position:fixed;right:18px;bottom:90px;z-index:71;width:min(370px,calc(100vw - 36px));height:min(540px,calc(100vh - 120px));background:#fff;border-radius:24px;box-shadow:0 30px 70px -24px rgba(43,27,46,.55);display:flex;flex-direction:column;overflow:hidden;transform:translateY(16px) scale(.97);opacity:0;pointer-events:none;transition:all .35s cubic-bezier(.22,.7,.2,1)}
  .lt-panel.open{transform:none;opacity:1;pointer-events:auto}
  .lt-head{background:#1f3a6e;color:#fff;padding:15px 18px;display:flex;align-items:center;gap:12px}
  .lt-head b{display:block;font:800 1.15rem 'Cormorant',Georgia,serif}
  .lt-head small{color:#f6e7b8;font-size:.78rem}
  .lt-head .x{margin-left:auto;background:rgba(255,255,255,.15);border:0;color:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:1rem}
  .lt-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#fbf7ef}
  .lt-m{max-width:86%;padding:10px 14px;border-radius:18px;font-size:.93rem;line-height:1.5;white-space:pre-line;animation:ltIn .35s ease both}
  .lt-m a{color:#1f3a6e;font-weight:800}
  .lt-bot{background:#fff;border:1px solid #e9e0cf;border-bottom-left-radius:5px;color:#3b3040}
  .lt-me{align-self:flex-end;background:#1f3a6e;color:#fff;border-bottom-right-radius:5px}
  .lt-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px;background:#fbf7ef}
  .lt-chips button{border:2px solid #1f3a6e;background:#fff;color:#1f3a6e;border-radius:999px;padding:5px 12px;font:700 .82rem 'Figtree',system-ui,sans-serif;cursor:pointer;transition:all .25s}
  .lt-chips button:hover{background:#1f3a6e;color:#f6e7b8}
  .lt-form{display:flex;gap:8px;padding:12px;border-top:1px solid #e9e0cf;background:#fff}
  .lt-form input{flex:1;min-width:0;border:2px solid #e9e0cf;border-radius:14px;padding:10px 14px;font:inherit;font-size:.94rem}
  .lt-form input:focus{outline:none;border-color:#1f3a6e}
  .lt-form button{width:44px;height:44px;border-radius:14px;border:0;background:#1f3a6e;color:#fff;cursor:pointer;display:grid;place-items:center}
  .lt-form svg{width:18px;height:18px}
  .lt-typing{display:inline-flex;gap:4px}.lt-typing span{width:6px;height:6px;border-radius:50%;background:#c9b8cc;animation:ltDot 1s infinite}.lt-typing span:nth-child(2){animation-delay:.15s}.lt-typing span:nth-child(3){animation-delay:.3s}
  @keyframes ltIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  @keyframes ltDot{0%,80%,100%{opacity:.3}40%{opacity:1}}
  @media (max-width:640px){.lt-btn span{display:none}.lt-btn{padding:6px;bottom:88px;right:14px}.lt-panel{bottom:150px;right:14px;height:min(500px,calc(100vh - 180px))}}
  @media (prefers-reduced-motion:reduce){.lt-m,.lt-panel{animation:none;transition:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const sendI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>';
  const root = document.createElement('div');
  root.innerHTML = `
  <button class="lt-btn" aria-expanded="false" aria-controls="lt-panel"><i aria-hidden="true">🍫</i><span>Ask Makers</span></button>
  <section class="lt-panel" id="lt-panel" role="dialog" aria-label="Chat with Makers London">
    <div class="lt-head"><div><b>Makers London</b><small>Automated assistant · set answers</small></div><button class="x" aria-label="Close chat">✕</button></div>
    <div class="lt-body" aria-live="polite"></div>
    <div class="lt-chips"></div>
    <form class="lt-form"><label class="sr-only" for="lt-in">Type your message</label><input id="lt-in" autocomplete="off" placeholder="Ask about bonbons, ingredients, the café…" maxlength="300"><button aria-label="Send">${sendI}</button></form>
  </section>`;
  document.body.appendChild(root);
  const btn = root.querySelector('.lt-btn'), panel = root.querySelector('.lt-panel'), body = root.querySelector('.lt-body'),
    chipBox = root.querySelector('.lt-chips'), form = root.querySelector('.lt-form'), input = root.querySelector('#lt-in');
  let started = false, busy = false;
  const add = (h, who = 'bot') => { const m = document.createElement('div'); m.className = 'lt-m lt-' + who; m.innerHTML = h; body.appendChild(m); body.scrollTop = body.scrollHeight; return m; };
  const say = (h, w = 420) => new Promise((r) => { const tp = add('<span class="lt-typing"><span></span><span></span><span></span></span>'); setTimeout(() => { tp.innerHTML = h; body.scrollTop = body.scrollHeight; r(); }, w); });
  const chips = (l) => { chipBox.innerHTML = ''; l.forEach((c) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.onclick = () => handle(c); chipBox.appendChild(b); }); };
  const MAIN = ['What’s inside?', 'The collections', 'The café', 'Gift boxes', 'Visit us'];
  const tel = () => `<a href="${S.phoneHref}">${S.phone}</a>`;
  const contact = () => `✉️ <a href="mailto:${S.email}">${esc(S.email)}</a>\n📞 ${tel()}\n📸 <a href="${S.instagram}" target="_blank" rel="noopener">Instagram</a>\n📍 ${esc(S.address)}`;
  const intents = [
    { re: /secret|off.?menu|iced/i, run: () => say(`Ah, you’ve heard about the secret off-menu iced chocolate 🤫 Ask for it at the counter…`).then(() => chips(MAIN)) },
    { re: /ingredient|sugar|dairy|vegan|wheat|gluten|seed oil|paleo|healthy|free|sweet|artificial|inside|allerg|nut/i, run: () => say(`Everything at Makers is made without refined sugar, dairy, wheat, seed oils or anything artificial: no flavourings, colourings or preservatives. Our rule: if it doesn’t taste better than the conventional version, it doesn’t make the cut. For allergen details, please ask in store or email <a href="mailto:${S.email}">${S.email}</a>.`).then(() => chips(['The collections', 'Gift boxes'])) },
    { re: /gift|box|corporate|order|present|hamper|wedding|event/i, run: () => say(`Our bonbons and candy bars come in bento-inspired boxes, perfect for gifting. For gift boxes, corporate gifts and pre-orders, use our <a href="order.html">order form</a> and we’ll be in touch.`).then(() => chips(['The collections', 'Contact'])) },
    { re: /collection|bonbon|fantas|classic|nostalg|candy ?bar|flavou?r|praline|praliné|marzipan|matcha|caramel|tahini/i, run: () => say(`Three collections: <b>The Fantasies</b> (sphere bonbons like Matcha Cassis and Soba Cha), <b>The Classics</b> (square bonbons like pistachio marzipan and coffee cardamom) and <b>The Nostalgics</b> (candy bars reimagined with superfoods). <a href="collections.html">See them all</a>`).then(() => chips(['What’s inside?', 'Gift boxes'])) },
    { re: /caf[eé]|hot choc|drink|coffee|ice cream|soft.?serve|cake|bake|spread/i, run: () => say(`In the café: hot chocolate on tap, soft-serve ice cream, coffee and matcha, our signature Matcha Cassis, plus paleo bakes like the marble bundt. <a href="cafe.html">The café</a>`).then(() => chips(['Visit us', 'The collections'])) },
    { re: /noor|founder|who|story|alex|vandale|chocolatier|lebanon|lebanese/i, run: () => say(`Makers was founded by Noor Freiha, a chemical engineering graduate who taught herself to make chocolate at home. Every recipe is built from scratch with Belgian chocolatier Alexandre Vandale. <a href="story.html">Our story</a>`).then(() => chips(MAIN)) },
    { re: /where|visit|address|location|open|hour|chelsea|fulham|direction/i, run: () => say(`📍 ${esc(S.address)}, on the corner of Fulham Road and Old Church Street. For today’s opening hours, check our Instagram or call ${tel()}. <a href="cafe.html#visit">Map & directions</a>`).then(() => chips(MAIN)) },
    { re: /price|cost|how much|£/i, run: () => say(`For current prices, pop in, check our Instagram or email <a href="mailto:${S.email}">${S.email}</a>.`).then(() => chips(MAIN)) },
    { re: /deliver|ship|post|courier/i, run: () => say(`For delivery questions or gift orders, please use the <a href="order.html">order form</a> or email <a href="mailto:${S.email}">${S.email}</a>.`).then(() => chips(MAIN)) },
    { re: /contact|phone|call|email|talk|message|instagram|press/i, run: () => say(`You can reach us here:\n${contact()}`).then(() => chips(MAIN)) },
    { re: /^(hi|hello|hey|hiya|marhaba|good (morning|afternoon|evening))\b/i, run: () => say('Hello! Ahlan! 🍫 What can we help you with?').then(() => chips(MAIN)) },
    { re: /thank|shukran|cheers|great|perfect|love/i, run: () => say('Thank you! Enjoy every guilt-free bite. 🍫').then(() => chips(MAIN)) },
  ];
  async function handle(text) {
    if (busy || !text.trim()) return;
    busy = true; add(esc(text), 'me');
    try {
      const map = { 'What’s inside?': 'ingredients', 'The collections': 'collections', 'The café': 'cafe', 'Gift boxes': 'gift box', 'Visit us': 'visit location', 'Contact': 'contact' };
      const q = map[text] || text, hit = intents.find((i) => i.re.test(q));
      if (hit) { await hit.run(); return; }
      await say(`I don’t have a set answer for that one, but we can help:\n${contact()}`); chips(MAIN);
    } finally { busy = false; }
  }
  const open = async (s) => {
    panel.classList.toggle('open', s); btn.setAttribute('aria-expanded', String(s));
    if (s) { input.focus(); if (!started) { started = true; await say('Welcome to <strong>Makers</strong>, chocolate without compromise, on Old Church Street in Chelsea. Ask me about our ingredients, collections, the café or gift boxes.', 300); chips(MAIN); } }
  };
  btn.addEventListener('click', () => open(!panel.classList.contains('open')));
  root.querySelector('.x').addEventListener('click', () => open(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('open')) open(false); });
  form.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; handle(v); });
})();
