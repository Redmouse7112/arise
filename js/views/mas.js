// Menú "Más": pantallas que no entran en la barra principal.
import { APP_VERSION } from '../data.js';
import { isInstalled, instalar } from '../instalar.js';

const ITEMS = [
  ['#/plan', 'Plan semanal', 'Elegí qué rutina toca cada día'],
  ['#/rutinas', 'Rutinas', 'Armá tus rutinas y ejercicios'],
  ['#/sparring', 'Diario de sparring', 'Qué salió bien, qué falló y qué trabajar'],
  ['#/trote', 'Historial de trote', 'Tus trotes con tiempo, distancia y sensación'],
  ['#/estado/ajustes', 'Ajustes', 'Cinturón, examen y copia de seguridad'],
  ['#/novedades', 'Novedades', 'Qué cambió en cada versión'],
];

export function render(root) {
  root.innerHTML = `<div class="head"><h1>Más</h1><span class="up">v${APP_VERSION}</span></div>
  ${ITEMS.map(([h, t, d]) => `<a class="ex mnu" href="${h}"><div><div class="t">${t}</div><div class="mut" style="font-size:.82rem">${d}</div></div><span class="mut" aria-hidden="true">›</span></a>`).join('')}
  ${isInstalled() ? '' : `<button class="ex mnu" id="inst" style="width:100%;text-align:left"><div><div class="t">Instalar la app</div><div class="mut" style="font-size:.82rem">Abrila como una app, sin internet</div></div><span class="mut" aria-hidden="true">›</span></button>`}`;
  const b = root.querySelector('#inst'); if (b) b.onclick = instalar;
}
