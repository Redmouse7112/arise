// Plan semanal editable: qué rutina toca cada día.
import { DAYS } from '../data.js';
import { get, save } from '../store.js';
import { esc } from '../ui.js';

export function render(root, ctx) {
  const S = get(), today = new Date().getDay();
  const order = [1, 2, 3, 4, 5, 6, 0];
  const opts = (sel) => `<option value="">— Sin rutina —</option>${S.routines.map((r) => `<option value="${esc(r.id)}" ${sel === r.id ? 'selected' : ''}>${esc(r.n)}</option>`).join('')}`;
  root.innerHTML = `
  <div class="head"><h1>Plan semanal</h1><a class="btn sm" href="#/rutinas">Mis rutinas</a></div>
  <section class="panel">
    ${order.map((d) => `
      <div class="row" style="padding:9px 0;border-bottom:1px solid var(--line)">
        <div style="width:96px;${d === today ? 'color:var(--acc);font-weight:700' : ''}">${DAYS[d]}${d === today ? ' · hoy' : ''}</div>
        <select class="pick" data-d="${d}" style="flex:1">${opts(S.plan[d])}</select>
      </div>`).join('')}
    <p class="mut" style="font-size:.82rem;margin:12px 0 0">Si un día se corre, cambiá solo la rutina de hoy desde "Misión". El plan base no se toca. Los cambios valen de hoy en adelante: los días ya registrados no se modifican.</p>
  </section>`;
  root.querySelectorAll('select[data-d]').forEach((s) => s.addEventListener('change', (e) => {
    S.plan[+e.target.dataset.d] = e.target.value; save(); ctx.toast('Plan guardado');
  }));
}
