/* ============================================================
   J.A.R.V.I.S. — app.js
   Voz, chat com streaming via OpenAI e configurações.
   ============================================================ */

const $ = (id) => document.getElementById(id);

const els = {
  chat: $('chat'),
  welcome: $('welcome'),
  input: $('input'),
  sendBtn: $('sendBtn'),
  micBtn: $('micBtn'),
  micrometer: $('micState'),
  voiceState: $('voiceState'),
  levelFill: $('levelFill'),
  reactor: $('reactor'),
  reactorStatus: $('reactorStatus'),
  statusText: $('statusText'),
  statusDot: $('statusDot'),
  clock: $('clock'),
  date: $('date'),
  settingsBtn: $('settingsBtn'),
  settingsModal: $('settingsModal'),
  closeSettings: $('closeSettings'),
  provider: $('provider'),
  apiKey: $('apiKey'),
  model: $('model'),
  voiceSelect: $('voiceSelect'),
  voiceEnabled: $('voiceEnabled'),
  autoListen: $('autoListen'),
  useServerProxy: $('useServerProxy'),
  saveSettings: $('saveSettings'),
  testVoice: $('testVoice'),
};

const SYSTEM_PROMPT = [
  'Você é o J.A.R.V.I.S. (Just A Rather Very Intelligent System),',
  'o assistente pessoal do Homem de Ferro, Tony Stark.',
  'Seja prestativo, inteligente, conciso e elegante, com um toque',
  'de personalidade divertida e sofisticada. Trate o usuário como "senhor".',
  'Responda em português do Brasil, salvo se o usuário pedir outra língua.',
  'Prefira respostas objetivas e bem estruturadas.',
].join(' ');

/* ------------------- state ------------------- */
let provider = localStorage.getItem('jarvis_provider') || 'groq';
let apiKey = localStorage.getItem('jarvis_apiKey') || '';
let model = localStorage.getItem('jarvis_model') || 'openai/gpt-oss-120b';
let voiceURI = localStorage.getItem('jarvis_voice') || '';
let voiceEnabled = localStorage.getItem('jarvis_voiceEnabled') !== '0';
let autoListen = localStorage.getItem('jarvis_autoListen') !== '0';
// true = chamar pelo servidor (proxy) | false = chamar direto do navegador (padrão)
let useServerProxy = localStorage.getItem('jarvis_useServerProxy') === '1';

let history = []; // {role, content}
let recording = false;
let isProcessing = false;
let levelTimer = null;

let voices = [];
let recognition = null;
let recognitionSupported = false;

/* ------------------- clock ------------------- */
function tickClock() {
  const now = new Date();
  els.clock.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  els.date.textContent = now.toLocaleDateString('pt-BR');
}
tickClock();
setInterval(tickClock, 1000);

/* ------------------- reactor state ------------------- */
function setReactor(state, label) {
  els.reactor.classList.toggle('listening', state === 'listening');
  els.reactor.classList.toggle('speaking', state === 'speaking');
  els.reactor.classList.toggle('thinking', state === 'thinking');
  els.reactorStatus.textContent =
    state === 'listening' ? 'OUVINDO' :
    state === 'speaking' ? 'FALANDO' :
    state === 'thinking' ? 'PROCESSANDO' : 'STANDBY';
}

function setBusy(busy) {
  isProcessing = busy;
  els.micBtn.classList.toggle('busy', busy);
  els.sendBtn.disabled = busy;
}

/* ------------------- chat bubbles ------------------- */
function removeWelcome() {
  if (els.welcome) els.welcome.remove();
}

function addBubble(role, text = '', streaming = false) {
  removeWelcome();
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + role;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role === 'user' ? 'VOCÊ' : 'JARVIS';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  const span = document.createElement('span');
  span.textContent = text;
  bubble.appendChild(span);
  let cursor = null;
  if (streaming) {
    cursor = document.createElement('span');
    cursor.className = 'cursor';
    bubble.appendChild(cursor);
  }

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  els.chat.appendChild(wrap);
  scrollBottom();

  return {
    setText(t) {
      span.textContent = t;
      scrollBottom();
    },
    finish(t) {
      span.textContent = t;
      if (cursor) cursor.remove();
      scrollBottom();
    },
  };
}

function scrollBottom() {
  els.chat.scrollTop = els.chat.scrollHeight;
}

/* ------------------- local commands ------------------- */
function normalize(t) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function handleLocal(text) {
  const t = normalize(text);

  if (/limpar|reset|recarregar|limpa|zera/.test(t) && history.length) {
    return { clear: true };
  }

  if (/que hora(s)?\b|hora(s)? agora|que horas sao/.test(t)) {
    return { reply: `São ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} em ponto, senhor.` };
  }

  if (/que dia|data de hoje|que dia e hoje|data hoje|qual a data/.test(t)) {
    return { reply: `Hoje é ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.` };
  }

  if (/abrir google|abre o google/.test(t)) {
    window.open('https://www.google.com', '_blank');
    return { reply: 'Abrindo o Google para o senhor.' };
  }

  return null;
}

/* ------------------- IA streaming ------------------- */
const PROVIDER_ENDPOINTS = {
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
};

// Lê um response body em stream de Server-Sent Events (SSE) da Groq/OpenAI.
async function readSSE(response, onDelta) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl;
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const j = JSON.parse(data);
        if (j.delta) {
          full += j.delta;
          onDelta(full);
        }
        if (j.error) throw new Error(j.error);
      } catch (err) {
        if (err.message && err.message !== 'Unexpected end of JSON input') throw err;
      }
    }
  }
  return full;
}

// Chamada DIRETA do navegador para o provedor. É o que funciona no preview,
// pois o sandbox do servidor não tem internet, mas o SEU navegador tem.
// Observação: apenas funciona se o provedor permitir CORS (Groq/OpenAI aceitam).
async function streamDirect(apiMessages, onDelta) {
  const endpoint = PROVIDER_ENDPOINTS[provider];
  let res;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        temperature: 0.7,
        stream: true,
      }),
    });
  } catch (e) {
    // Falha de rede / CORS do navegador -> sinaliza para tentar o proxy do servidor.
    throw new Error('NETWORK');
  }

  if (!res.ok) {
    let msg = `Erro da API (status ${res.status}).`;
    try {
      const j = await res.json();
      msg = j?.error?.message || msg;
    } catch {}
    if (res.status === 401) msg = 'API key inválida ou expirada. Verifique nas configurações.';
    if (res.status === 404 || res.status === 400) msg = 'Modelo inválido para este provedor. Selecione outro modelo nas configurações.';
    throw new Error(msg);
  }
  return readSSE(res, onDelta);
}

// Chamada via proxy do servidor (equivale ao provedor, mas passa pelo Node).
// Útil quando o ambiente de hospedagem do servidor tem internet (ex.: rodando local).
async function streamViaServer(apiMessages, onDelta) {
  let res;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, model, messages: apiMessages }),
    });
  } catch (e) {
    throw new Error('Sem conexão com o servidor JARVIS.');
  }

  if (!res.ok) {
    let msg = 'Erro na comunicação com a API.';
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return readSSE(res, onDelta);
}

// Decide a rota: direto do navegador (padrão) com fallback para o servidor.
async function streamAnswer(apiMessages, onDelta) {
  if (!useServerProxy) {
    try {
      return await streamDirect(apiMessages, onDelta);
    } catch (err) {
      if (err.message !== 'NETWORK') throw err;
      // direto falhou -> tenta o proxy do servidor
    }
  }
  return streamViaServer(apiMessages, onDelta);
}

/* ------------------- send flow ------------------- */
function sendMessage(raw) {
  const text = (raw || '').trim();
  if (!text || isProcessing) return;

  els.input.value = '';
  addBubble('user', text);
  history.push({ role: 'user', content: text });

  const local = handleLocal(text);
  if (local) {
    if (local.clear) {
      clearChat();
      return;
    }
    addBubble('assistant', local.reply);
    history.push({ role: 'assistant', content: local.reply });
    speak(local.reply);
    return;
  }

  setBusy(true);
  setReactor('thinking');
  const apiMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...history];
  const bubble = addBubble('assistant', '', true);

  streamAnswer(apiMessages, (full) => bubble.setText(full))
    .then((full) => {
      bubble.finish(full);
      history.push({ role: 'assistant', content: full });
      speak(full);
      setBusy(false);
      setReactor('idle');
      if (autoListen) queueListening();
    })
    .catch((err) => {
      bubble.finish(`⚠️ ${err.message}`);
      setBusy(false);
      setReactor('idle');
      if (autoListen) queueListening();
    });
}

function clearChat() {
  els.chat.querySelectorAll('.msg').forEach((m) => m.remove());
  history = [];
  setReactor('idle');
  const w = document.createElement('div');
  w.className = 'welcome';
  w.innerHTML = '<h1>Conversa limpa.</h1><p>Pronto para novos comandos, senhor.</p>';
  els.chat.appendChild(w);
}

/* ------------------- speech synthesis ------------------- */
function loadVoices() {
  voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  populateVoiceSelect();
  if (!voiceURI && voices.length) {
    const pt = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('pt'));
    if (pt) voiceURI = pt.voiceURI;
  }
  els.voiceState.textContent = voices.length ? 'Pronta' : 'Indisponível';
}

function populateVoiceSelect() {
  const pt = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('pt'));
  const rest = voices.filter((v) => !(v.lang && v.lang.toLowerCase().startsWith('pt')));
  const optList = [...pt, ...rest];

  els.voiceSelect.innerHTML = '';
  optList.forEach((v) => {
    const o = document.createElement('option');
    o.value = v.voiceURI;
    o.textContent = `${v.name} (${v.lang})`;
    els.voiceSelect.appendChild(o);
  });
  if (voiceURI) els.voiceSelect.value = voiceURI;
  else if (optList.length) els.voiceSelect.selectedIndex = 0;
  if (!optList.length) {
    const o = document.createElement('option');
    o.value = '';
    o.textContent = 'Nenhuma voz disponível';
    els.voiceSelect.appendChild(o);
  }
}

function speak(text) {
  if (!voiceEnabled || !window.speechSynthesis) return;
  const clean = text.replace(/https?:\/\/\S+/g, 'link').replace(/[#*_`]/g, '');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = 'pt-BR';
  u.rate = 1.02;
  u.pitch = 0.95;
  const v =
    voices.find((vv) => vv.voiceURI === voiceURI) ||
    voices.find((vv) => vv.lang && vv.lang.toLowerCase().startsWith('pt')) ||
    null;
  if (v) u.voice = v;
  u.onstart = () => setReactor('speaking');
  u.onend = () => {
    setReactor('idle');
    if (autoListen) queueListening();
  };
  u.onerror = () => setReactor('idle');
  speechSynthesis.speak(u);
}

/* ------------------- speech recognition ------------------- */
function initRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    recognitionSupported = false;
    els.micrometer.textContent = 'Indisponível';
    els.micBtn.title = 'Reconhecimento de fala não suportado neste navegador';
    els.micBtn.style.opacity = '0.4';
    return;
  }
  recognitionSupported = true;
  recognition = new SR();
  recognition.lang = 'pt-BR';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    recording = true;
    els.micBtn.classList.add('recording');
    setReactor('listening');
    levelTimer = setInterval(() => {
      els.levelFill.style.width = `${15 + Math.random() * 85}%`;
    }, 90);
  };

  recognition.onresult = (e) => {
    let interim = '';
    let final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const tr = e.results[i];
      if (tr.isFinal) final += tr[0].transcript;
      else interim += tr[0].transcript;
    }
    if (final) {
      els.input.value = final;
      stopListening();
      sendMessage(final);
      final = '';
    } else {
      els.input.value = interim;
    }
  };

  recognition.onerror = (e) => {
    if (e.error === 'not-allowed') {
      els.micrometer.textContent = 'Permição negada';
    }
  };

  recognition.onend = () => {
    recording = false;
    els.micBtn.classList.remove('recording');
    if (levelTimer) { clearInterval(levelTimer); levelTimer = null; }
    els.levelFill.style.width = '0%';
    if (!isProcessing && !speechSynthesis.speaking) setReactor('idle');
  };
}

function startListening() {
  if (!recognitionSupported || recording || isProcessing) return;
  try {
    recognition.start();
  } catch (e) {
    /* already started */
  }
}

function stopListening() {
  if (recognition && recording) recognition.stop();
}

function queueListening() {
  // small delay so TTS finishes announcing state before opening the mic again
  setTimeout(() => {
    if (!recording && !isProcessing && !speechSynthesis.speaking) startListening();
  }, 400);
}

/* ------------------- settings ------------------- */
function openSettings() {
  els.provider.value = provider;
  els.apiKey.value = apiKey;
  els.model.value = model;
  els.voiceEnabled.checked = voiceEnabled;
  els.autoListen.checked = autoListen;
  els.useServerProxy.checked = useServerProxy;
  if (voiceURI) els.voiceSelect.value = voiceURI;
  els.model.disabled = false;
  syncModelForProvider();
  els.settingsModal.hidden = false;
}

function closeSettings() {
  els.settingsModal.hidden = true;
}

function saveSettings() {
  provider = els.provider.value;
  apiKey = els.apiKey.value.trim();
  model = els.model.value;
  voiceURI = els.voiceSelect.value;
  voiceEnabled = els.voiceEnabled.checked;
  autoListen = els.autoListen.checked;
  useServerProxy = els.useServerProxy.checked;

  localStorage.setItem('jarvis_provider', provider);
  localStorage.setItem('jarvis_apiKey', apiKey);
  localStorage.setItem('jarvis_model', model);
  localStorage.setItem('jarvis_voice', voiceURI);
  localStorage.setItem('jarvis_voiceEnabled', voiceEnabled ? '1' : '0');
  localStorage.setItem('jarvis_autoListen', autoListen ? '1' : '0');
  localStorage.setItem('jarvis_useServerProxy', useServerProxy ? '1' : '0');

  els.voiceState.textContent = voiceEnabled ? 'Pronta' : 'Desativada';
  closeSettings();
  if (apiKey) {
    els.statusText.textContent = 'ONLINE';
    els.statusDot.classList.remove('offline');
  } else {
    els.statusText.textContent = 'AGUARDANDO KEY';
    els.statusDot.classList.add('offline');
  }
}

// validate the selection is a model that exists for the chosen provider
function syncModelForProvider() {
  const current = els.model.value;
  els.model.querySelectorAll('optgroup').forEach((og) => {
    og.style.display = og.label === (provider === 'groq' ? 'Groq' : 'OpenAI') ? '' : 'none';
  });
  const anyVisible = Array.from(els.model.options).some((o) => o.value === current && o.closest('optgroup').style.display !== 'none');
  if (!anyVisible) {
    // pick first visible option
    const first = Array.from(els.model.options).find((o) => o.closest('optgroup').style.display !== 'none');
    if (first) els.model.value = first.value;
  }
}
els.provider.addEventListener('change', () => {
  provider = els.provider.value;
  syncModelForProvider();
});

/* ------------------- wire up ------------------- */
els.sendBtn.addEventListener('click', () => sendMessage(els.input.value));
els.input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage(els.input.value);
  }
});
els.micBtn.addEventListener('click', () => {
  if (recording) stopListening();
  else startListening();
});

els.settingsBtn.addEventListener('click', openSettings);
els.closeSettings.addEventListener('click', closeSettings);
els.settingsModal.addEventListener('click', (e) => {
  if (e.target === els.settingsModal) closeSettings();
});
els.saveSettings.addEventListener('click', saveSettings);
els.testVoice.addEventListener('click', () => {
  voiceURI = els.voiceSelect.value;
  const keep = voiceEnabled;
  voiceEnabled = true;
  speak('Sistemas operacionais online. JARVIS ao seu dispor, senhor.');
  voiceEnabled = keep;
});

// quick action chips
document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const cmd = chip.dataset.cmd;
    if (cmd === 'hora') sendMessage('Que horas são?');
    else if (cmd === 'data') sendMessage('Que dia é hoje?');
    else if (cmd === 'piada') sendMessage('Conte uma piada.');
    else if (cmd === 'google') sendMessage('Abrir Google');
    else if (cmd === 'limpar') {
      clearChat();
      speak('Conversa limpa, senhor.');
    }
  });
});

/* ------------------- init ------------------- */
if (window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}
initRecognition();

if (!apiKey) {
  els.statusText.textContent = 'AGUARDANDO KEY';
  els.statusDot.classList.add('offline');
}
