// Menú "Más": pantallas que no entran en la barra principal.
import { APP_VERSION } from '../data.js';
import { isInstalled, instalar } from '../instalar.js';
import { modActivo, hayMision } from '../store.js';

// [ruta, título, descripción, módulo que necesita]; 'mision' = alguno de gym, cal, trote o artes
const ITEMS = [
  ['#/plan', 'Plan semanal', 'Elegí qué rutina toca cada día', 'mision'],
  ['#/rutinas', 'Rutinas', 'Armá tus rutinas y ejercicios', 'mision'],
  ['#/sparring', 'Diario de sparring', 'Qué salió bien, qué falló y qué trabajar', 'artes'],
  ['#/trote', 'Historial de trote', 'Tus trotes con tiempo, distancia y sensación', 'trote'],
  ['#/estado/ajustes', 'Ajustes', 'Módulos, cinturón y copia de seguridad', ''],
  ['#/novedades', 'Novedades', 'Qué cambió en cada versión', ''],
];

export function render(root) {
  root.innerHTML = `<div class="head"><h1>Más</h1><span class="up">v${APP_VERSION}</span></div>
  ${ITEMS.filter((i) => (i[3] === 'mision' ? hayMision() : modActivo(i[3]))).map(([h, t, d]) => `<a class="ex mnu" href="${h}"><div><div class="t">${t}</div><div class="mut" style="font-size:.82rem">${d}</div></div><span class="mut" aria-hidden="true">›</span></a>`).join('')}
  ${isInstalled() ? '' : `<button class="ex mnu" id="inst" style="width:100%;text-align:left"><div><div class="t">Instalar la app</div><div class="mut" style="font-size:.82rem">Abrila como una app, sin internet</div></div><span class="mut" aria-hidden="true">›</span></button>`}`;
  const b = root.querySelector('#inst'); if (b) b.onclick = instalar;
}
