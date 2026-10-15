// Plan semanal editable.
import { SESS, DAYS } from '../data.js';
import { get, save, ymd } from '../store.js';

export function render(root, ctx) {
  const S = get(), today = new Date().getDay();
  const order = [1, 2, 3, 4, 5, 6, 0];
  root.innerHTML = `
  <div class="head"><h1>Plan semanal</h1></div>
  <section class="panel">
    ${order.map((d) => `
      <div class="row" style="padding:9px 0;border-bottom:1px solid var(--line)">
        <div style="width:96px;${d === today ? 'color:var(--acc);font-weight:700' : ''}">${DAYS[d]}${d === today ? ' · hoy' : ''}</div>
        <select class="pick" data-d="${d}" style="flex:1">${Object.entries(SESS).map(([k, v]) => `<option value="${k}" ${S.plan[d] === k ? 'selected' : ''}>${v.n}</option>`).join('')}</select>
      </div>`).join('')}
    <p class="mut" style="font-size:.82rem;margin:12px 0 0">Si un día se corre, cambiá solo la sesión de hoy desde "Misión". El plan base no se toca.</p>
  </section>`;
  root.querySelectorAll('select[data-d]').forEach((s) => s.addEventListener('change', (e) => {
    S.plan[+e.target.dataset.d] = e.target.value; save(); ctx.toast('Plan guardado');
  }));
}
