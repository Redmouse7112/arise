// Historial de trote (#/trote).
import { runList } from '../entreno.js';

export function render(root) {
  const list = runList(), km = list.reduce((a, r) => a + (r.km || 0), 0), min = list.reduce((a, r) => a + r.min, 0);
  root.innerHTML = `<div class="head"><h1>Historial de trote</h1></div>
  <div class="grid2" style="margin-bottom:14px"><div class="panel stat" style="margin:0"><div class="up">Trotes</div><b class="num">${list.length}</b></div>
    <div class="panel stat" style="margin:0"><div class="up">Total</div><b class="num">${min} min${km ? ' · ' + (Math.round(km * 10) / 10) + ' km' : ''}</b></div></div>
  <section class="panel">${list.length ? list.map((r) => `<div class="row li"><div style="flex:1"><div style="font-weight:600;text-transform:capitalize">${new Date(r.date + 'T12:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
      <div class="mut num" style="font-size:.8rem">${r.mode === 'int' ? 'Intervalos' : 'Continuo'} · sensación ${r.feel}/5</div></div>
      <b class="num">${r.min} min${r.km ? ' · ' + r.km + ' km' : ''}</b></div>`).join('')
    : '<p class="mut" style="margin:0">Todavía no registraste ningún trote.</p>'}</section>
  <p class="mut" style="text-align:center"><a href="#/mas" style="text-decoration:underline">← Más</a></p>`;
}
