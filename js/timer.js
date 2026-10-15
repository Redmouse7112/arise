// Temporizador global: cuenta regresiva o cronómetro. Usa horas absolutas, no cuenta segundos,
// así sigue exacto aunque la app pase a segundo plano o se recargue.
const K = 'arise.timer';
let t = null, iv = null, ctx = null, lock = null;
const subs = new Set();

try { t = JSON.parse(localStorage.getItem(K)); } catch { t = null; }
if (t && t.mode === 'down' && !t.paused && Date.now() - t.end > 5000) t.fired = true; // venció hace rato

const persist = () => { try { t ? localStorage.setItem(K, JSON.stringify(t)) : localStorage.removeItem(K); } catch {} };

export function unlockAudio() {
  try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); ctx.resume && ctx.resume(); } catch {}
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
  return { ...t, elapsed: t.paused ? t.elapsed : now - t.start, running: !t.paused, done: false };
}
function tick() {
  const v = view();
  if (v && v.mode === 'down' && v.done && !t.fired) {
    t.fired = true; persist(); lockOff(); beep();
    try { navigator.vibrate && navigator.vibrate([250, 120, 250, 120, 500]); } catch {}
    subs.forEach((f) => f('done', v));
  }
  subs.forEach((f) => f('tick', view()));
  if (!t && iv) { clearInterval(iv); iv = null; }
}
const ensure = () => { if (!iv) iv = setInterval(tick, 250); };

export function startDown(ms, meta) { unlockAudio(); t = { mode: 'down', total: ms, end: Date.now() + ms, meta, fired: false }; persist(); lockOn(); ensure(); tick(); }
export function startUp(meta) { unlockAudio(); t = { mode: 'up', start: Date.now(), meta }; persist(); lockOn(); ensure(); tick(); }
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
  if (!t || t.mode !== 'down') return;
  if (t.paused) t.left += ms; else t.end += ms;
  t.total += ms; t.fired = false; persist(); ensure(); tick();
}
export function stop() { t = null; persist(); lockOff(); tick(); }
export const sub = (f) => { subs.add(f); ensure(); return () => subs.delete(f); };
export const fmt = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
export const fmtUp = (ms) => {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
