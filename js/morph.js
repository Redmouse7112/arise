// Actualización por diferencias del contenedor de la pantalla: al volver a dibujar una vista, solo se tocan los nodos
// que cambiaron. Los demás se conservan (con su foco, scroll y estado), así no hay parpadeo.
// Se instala sobre #view: la primera asignación de innerHTML de cada pantalla nueva reemplaza todo; las siguientes
// (ctx.refresh o redibujos internos de la misma pantalla) se aplican por diferencias.
const ON = ['onclick', 'onchange', 'oninput', 'onkeydown', 'onkeyup', 'onfocus', 'onblur', 'onsubmit', 'onpointerdown', 'ondblclick'];
const escuchas = new WeakMap();   // nodo -> [[tipo, fn, opciones]] de los listeners puestos con addEventListener
const setHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML').set;
let raiz = null, nueva = true;

export function instalar(root) {
  raiz = root;
  const orig = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (t, fn, o) {
    if (raiz && this instanceof Element && this !== raiz && raiz.contains(this)) {
      let l = escuchas.get(this); if (!l) escuchas.set(this, (l = []));
      l.push([t, fn, o]);
    }
    return orig.call(this, t, fn, o);
  };
  Object.defineProperty(root, 'innerHTML', {
    configurable: true,
    get: () => Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML').get.call(root),
    set(html) { if (nueva) { nueva = false; setHTML.call(root, html); } else morph(root, html); },
  });
}
// La próxima asignación de innerHTML reemplaza todo (navegación a otra pantalla).
export const pantallaNueva = () => { nueva = true; };

// Los handlers de la pantalla anterior apuntan a un render viejo: se sueltan antes de que la vista vuelva a enlazar los nuevos.
function soltar(n) {
  const l = escuchas.get(n);
  if (l) { for (const [t, fn, o] of l) n.removeEventListener(t, fn, o); escuchas.delete(n); }
  for (const p of ON) if (n[p]) n[p] = null;
}

const clave = (n) => (n.nodeType === 1 && n.id ? n.id : null);
const igual = (v, n) => v.nodeType === n.nodeType && (n.nodeType !== 1 || (v.tagName === n.tagName && clave(v) === clave(n)));
const PROPIOS = /^data-/;   // atributos que pone el código (no el HTML): no se borran

function atributos(v, n) {
  for (const a of n.attributes) if (v.getAttribute(a.name) !== a.value) v.setAttribute(a.name, a.value);
  for (const a of [...v.attributes]) if (!n.hasAttribute(a.name) && !PROPIOS.test(a.name) && a.name !== 'stroke-dashoffset') v.removeAttribute(a.name);
}

function actualizar(v, n) {
  if (v.nodeType !== 1) { if (v.nodeValue !== n.nodeValue) v.nodeValue = n.nodeValue; return; }
  soltar(v);
  atributos(v, n);
  const foco = v === document.activeElement;
  const t = v.tagName;
  if (t === 'TEXTAREA') {
    if (v.defaultValue !== n.textContent) v.defaultValue = n.textContent;
    if (!foco && v.value !== n.textContent) v.value = n.textContent;
    return;
  }
  if (t === 'INPUT') {
    if (v.type === 'file') return;
    if (!foco) { if (v.type === 'checkbox' || v.type === 'radio') v.checked = n.hasAttribute('checked'); else { const x = n.getAttribute('value') ?? ''; if (v.value !== x) v.value = x; } }
    return;
  }
  hijos(v, n);
  if (t === 'SELECT' && !foco) {
    const i = [...n.options].findIndex((o) => o.hasAttribute('selected'));
    if (v.selectedIndex !== (i < 0 ? 0 : i)) v.selectedIndex = i < 0 ? 0 : i;
  }
}

function hijos(v, n) {
  const nuevos = [...n.childNodes];
  let i = 0;
  for (const h of nuevos) {
    let c = v.childNodes[i];
    const k = clave(h);
    if (k && !(c && clave(c) === k)) {   // con id: busco el mismo nodo más adelante y lo traigo
      const otro = [...v.childNodes].slice(i).find((x) => clave(x) === k);
      if (otro) { v.insertBefore(otro, c || null); c = otro; }
    }
    if (c && igual(c, h)) actualizar(c, h);
    else v.insertBefore(document.importNode(h, true), c || null);
    i++;
  }
  while (v.childNodes.length > i) v.removeChild(v.lastChild);
}

export function morph(root, html) {
  const t = document.createElement('template');
  t.innerHTML = html;
  hijos(root, t.content);
}
