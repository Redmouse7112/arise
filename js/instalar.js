// Instalación de la app: botón propio con beforeinstallprompt y ayuda por navegador cuando no está disponible.
import { abrirModal } from './modal.js';

const FLAG = 'arise.instalada', DISMISS = 'arise.instalar';
const ls = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};
let deferred = null, toast = () => {};
const subs = new Set();
const notify = () => subs.forEach((f) => f());

export const onChange = (f) => { subs.add(f); return () => subs.delete(f); };
export const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
// Instalada = abierta como app, o instalada desde esta sesión/navegador (marca que se borra si el navegador vuelve a ofrecer instalar).
export const isInstalled = () => standalone() || ls.get(FLAG) === '1';
export const cardDismissed = () => ls.get(DISMISS) === '1';
export const dismissCard = () => { ls.set(DISMISS, '1'); notify(); };

export function init(toastFn) {
  toast = toastFn;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; ls.del(FLAG); notify(); });
  window.addEventListener('appinstalled', () => { deferred = null; ls.set(FLAG, '1'); toast('Arise instalada'); notify(); });
}

// Navegador detectado → instrucciones que existen de verdad en ese navegador.
export function navegador(ua = navigator.userAgent, touchMac = navigator.maxTouchPoints > 1) {
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touchMac)) return 'ios';
  const raro = /OPR\/|SamsungBrowser|EdgA|UCBrowser|Opera/.test(ua);   // navegadores donde no estoy seguro del menú
  if (/Android/.test(ua)) return /Firefox/.test(ua) ? 'firefox-android' : /Chrome/.test(ua) && !raro ? 'android' : 'otro';
  if (/Firefox/.test(ua)) return 'firefox';
  if (/Edg\//.test(ua)) return 'escritorio';
  if (/Chrome|Chromium/.test(ua) && !raro) return 'escritorio';
  if (/Safari/.test(ua)) return 'safari-mac';
  return 'otro';
}
const AYUDA = {
  ios: 'Tocá el botón <b>Compartir</b> y elegí <b>Agregar a pantalla de inicio</b>. Si no te aparece esa opción, abrí Arise en Safari.',
  android: 'Tocá el menú <b>⋮</b> del navegador y elegí <b>Instalar app</b>.',
  'firefox-android': 'Tocá el menú <b>⋮</b> del navegador y elegí <b>Instalar</b>.',
  escritorio: 'Buscá el <b>ícono de instalar</b> a la derecha de la barra de direcciones y tocalo.',
  'safari-mac': 'En Safari 17 o más nuevo, abrí el menú <b>Archivo</b> y elegí <b>Agregar al Dock</b>.',
  firefox: 'Firefox de escritorio no permite instalar apps web. Podés usar Arise desde el navegador, o abrirla en Chrome o Edge para instalarla.',
  otro: 'Buscá en el menú de tu navegador una opción como <b>Instalar app</b> o <b>Agregar a pantalla de inicio</b>. Si no la tiene, tu navegador no permite instalarla.',
};
export const ayudaPara = (n) => AYUDA[n] || AYUDA.otro;

export async function instalar() {
  if (!deferred) {
    abrirModal({ id: 'instalarAyuda', label: 'Cómo instalar Arise', titulo: 'Instalar Arise', html: `<p style="margin:0">${ayudaPara(navegador())}</p>`, boton: 'Entendido' });
    return;
  }
  const e = deferred; deferred = null;
  try {
    e.prompt();
    const { outcome } = await e.userChoice;
    if (outcome === 'accepted') { ls.set(FLAG, '1'); toast('Arise instalada'); }
  } catch {}
  notify();
}

// Tarjeta discreta para Estado (vacía si ya está instalada o si la descartaste).
export function tarjetaHTML() {
  if (isInstalled() || cardDismissed()) return '';
  return `<section class="panel" id="instCard"><div class="up" style="margin-bottom:6px">Instalar</div>
    <p style="margin:0 0 12px;font-size:.92rem">Instalá Arise en tu dispositivo: abre más rápido y funciona sin internet.</p>
    <div class="btns" style="justify-content:flex-start"><button class="btn sm pri" id="instBtn">Instalar Arise</button><button class="btn sm ghost" id="instNo">Ahora no</button></div></section>`;
}
export function tarjetaBind(root) {
  const b = root.querySelector('#instBtn'); if (b) b.onclick = instalar;
  const n = root.querySelector('#instNo'); if (n) n.onclick = dismissCard;
}
