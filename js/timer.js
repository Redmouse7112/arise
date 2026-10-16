// Temporizador global: cuenta regresiva o cronómetro. Usa horas absolutas, no cuenta segundos,
// así sigue exacto aunque la app pase a segundo plano o se recargue.
const K = 'arise.timer';
let t = null, iv = null, ctx = null, lock = null;
const subs = new Set();

try { t = JSON.parse(localStorage.getItem(K)); } catch { t = null; }
if (t && t.mode === 'down' && !t.paused && Date.now() - t.end > 5000) t.fired = true; // venció hace rato

// Fases (trote por intervalos, rondas de sparring): la fase actual se calcula desde la hora de inicio.
const phTotal = (ph) => ph.reduce((a, x) => a + x.ms, 0);
function locate(ph, e) {
  let acc = 0;
  for (let i = 0; i < ph.length; i++) { if (e < acc + ph[i].ms) return { idx: i, left: acc + ph[i].ms - e }; acc += ph[i].ms; }
  return { idx: ph.length - 1, left: 0 };
}
if (t && t.mode === 'phases') {
  const e = t.paused ? t.elapsed : Date.now() - t.start;
  if (!t.paused && e - phTotal(t.phases) > 5000) t.fired = true;
  t.li = locate(t.phases, Math.min(e, phTotal(t.phases))).idx;   // no pitar por fases que pasaron mientras la app estaba cerrada
}

const persist = () => { try { t ? localStorage.setItem(K, JSON.stringify(t)) : localStorage.removeItem(K); } catch {} };

export function unlockAudio() {
  try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); ctx.resume && ctx.resume(); } catch {}
}
function blip(n = 1) {
  if (!ctx) return;
  for (let i = 0; i < n; i++) {
    const o = ctx.createOscillator(), g = ctx.createGain(), s = ctx.currentTime + i * 0.18;
    o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.3, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.12);
    o.start(s); o.stop(s + 0.14);
  }
}
function beep() {
  if (!ctx) return;
  [0, 0.25, 0.5].forEach((d, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain(), s = ctx.currentTime + d;
    o.frequency.value = i === 2 ? 1040 : 780; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.35, s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.2);
    o.start(s); o.stop(s + 0.22);
  });
}
async function lockOn() { try { if ('wakeLock' in navigator && !lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch {} }
function lockOff() { try { lock && lock.release(); } catch {} lock = null; }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && t && !t.paused && !t.fired) lockOn(); });

export function view() {
  if (!t) return null;
  const now = Date.now();
  if (t.mode === 'down') {
    const left = t.paused ? t.left : Math.max(0, t.end - now);
    return { ...t, left, running: !t.paused && left > 0, done: left <= 0 };
  }
  if (t.mode === 'phases') {
    const total = phTotal(t.phases), e = t.paused ? t.elapsed : now - t.start, done = e >= total;
    const L = locate(t.phases, Math.min(e, total));
    return { ...t, elapsed: Math.min(e, total), total, idx: L.idx, n: t.phases.length, phase: t.phases[L.idx], left: done ? 0 : L.left, running: !t.paused && !done, done };
  }
  return { ...t, elapsed: t.paused ? t.elapsed : now - t.start, running: !t.paused, done: false };
}
function tick() {
  const v = view();
  if (v && v.mode === 'down' && v.done && !t.fired) {
    t.fired = true; persist(); lockOff(); beep();
    try { navigator.vibrate && navigator.vibrate([250, 120, 250, 120, 500]); } catch {}
    subs.forEach((f) => f('done', v));
  }
  if (v && v.mode === 'phases') {
    if (v.done && !t.fired) {
      t.fired = true; persist(); lockOff(); beep();
      try { navigator.vibrate && navigator.vibrate([250, 120, 250, 120, 500]); } catch {}
      subs.forEach((f) => f('done', v));
    } else if (!v.done && v.running) {
      if (t.li !== v.idx) { t.li = v.idx; persist(); blip(); try { navigator.vibrate && navigator.vibrate(150); } catch {} }
      if (v.phase.warn && v.left <= v.phase.warn && t.lw !== v.idx) { t.lw = v.idx; persist(); blip(2); }
    }
  }
  subs.forEach((f) => f('tick', view()));
  if (!t && iv) { clearInterval(iv); iv = null; }
}
const ensure = () => { if (!iv) iv = setInterval(tick, 250); };

export function startDown(ms, meta) { unlockAudio(); t = { mode: 'down', total: ms, end: Date.now() + ms, meta, fired: false }; persist(); lockOn(); ensure(); tick(); }
export function startUp(meta) { unlockAudio(); t = { mode: 'up', start: Date.now(), meta }; persist(); lockOn(); ensure(); tick(); }
// phases: [{ label, ms, round?, rounds?, warn? }]; avanza sola con pitido corto en cada cambio y largo al final.
export function startPhases(phases, meta) {
  unlockAudio();
  t = { mode: 'phases', phases: phases.map((p) => ({ ...p })), start: Date.now(), meta, fired: false, li: 0, lw: -1 };
  persist(); lockOn(); ensure(); tick();
}
export function pause() {
  const v = view(); if (!v || t.paused) return;
  if (t.mode === 'down') t.left = v.left; else t.elapsed = v.elapsed;
  t.paused = true; persist(); tick();
}
export function resume() {
  if (!t || !t.paused) return;
  if (t.mode === 'down') t.end = Date.now() + t.left; else t.start = Date.now() - t.elapsed;
  t.paused = false; persist(); lockOn(); tick();
}
export function add(ms) {
  if (t && t.mode === 'phases') {   // +tiempo en la fase actual
    const v = view(); if (!v || v.done) return;
    t.phases[v.idx].ms += ms; if (t.lw === v.idx && v.left + ms > (v.phase.warn || 0)) t.lw = -1;
    persist(); tick(); return;
  }
  if (!t || t.mode !== 'down') return;
  if (t.paused) t.left += ms; else t.end += ms;
  t.total += ms; t.fired = false; persist(); ensure(); tick();
}
export function stop() { t = null; persist(); lockOff(); tick(); }
export const elapsedOf = (v) => (v.mode === 'down' ? v.total - v.left : v.elapsed);
export const sub = (f) => { subs.add(f); ensure(); return () => subs.delete(f); };
export const fmt = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
export const fmtUp = (ms) => {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
