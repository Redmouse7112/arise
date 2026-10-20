# Dankai — estilo actual (auditoría previa a la 2.3.0)

Inventario de **cómo está hecho el estilo hoy** (versión 2.2.4, commit `f1cc5c4`). Es solo lectura: no se cambió código, versión ni datos. Todo salió de leer `css/base.css`, `css/ui.css`, `index.html`, `sw.js`, `js/**` y de medir los archivos del repo. Lo que no se pudo determinar leyendo el código está marcado como **«No determinado»**.

Convenciones: `archivo:línea`. Las líneas son las del commit auditado. «Raíz» = la carpeta del repo (la carpeta `app`).

---

## 1. CSS

### 1.1 Archivos

| Archivo | Bytes | Líneas | gzip aprox. | `:root` |
|---|---:|---:|---:|---|
| `css/base.css` | 4.421 | 63 | 1,7 KB | Sí, `base.css:1-6` |
| `css/ui.css` | 15.096 | 175 | 3,8 KB | No (solo usa las variables) |
| **Total** | **19.517** | 238 | 5,5 KB | |

- No hay hojas de estilo externas, ni `<style>` en `index.html`, ni preprocesador. Los dos CSS se cargan desde `index.html` y están en `CORE` de `sw.js`.
- `:root` define **14 propiedades**: 11 de color (`--bg`, `--bg2`, `--ink`, `--mut`, `--line`, `--panel`, `--acc`, `--sc`, `--ok`, `--warn`, `--bad`), 2 de medida (`--r: 14px`, `--nav-h: 64px`, que pasa a `0px` desde 900 px, `base.css:56`) y 1 de fuente (`--font`).
- Usos de `var(--x)` en CSS: `--acc` 43, `--line` 25, `--mut` 13, `--ok` 12, `--ink` 8, `--bg` 3, `--nav-h` 4, `--r` 4, `--sc` 2, `--warn` 1, `--bg2` 1, `--panel` 1, `--font` 1, **`--bad` 0** (definida y sin uso en CSS).
- **`--acc` no es fijo**: `js/app.js:75-77` (`theme()`) la reescribe en `<html>` con el color del cinturón (`BELTS` en `js/data.js:5-11`, 7 colores) en cada `route()`. Además, varias vistas la pisan en línea (ver 1.3).
- 244 ocurrencias de `style=` en 19 archivos JS (201 líneas) dibujan estilo **dentro del HTML generado**: márgenes (63 + 55 + 28), anchos (24), tamaños de letra (ver 2), pesos y colores. Un cambio de tokens en CSS **no los alcanza**.

### 1.2 Colores declarados como variable (`css/base.css:1-6`)

| Variable | Valor | Tipo | Dónde se usa |
|---|---|---|---|
| `--bg` | `#050b18` | fondo | `html, body`; degradado de `body` (`base.css:9-15`); `#splash`; `#nav` usa su versión alfa literal (`base.css:39`); también `<meta theme-color>` y `manifest` |
| `--bg2` | `#0a1630` | fondo | solo en el degradado de `body` (`base.css:13`) |
| `--ink` | `#e6f0ff` | texto | texto base; `.today em`, `.sw.on`, bordes activos; inline en `estado.js` (6 veces) |
| `--mut` | `#8ea3c4` | texto secundario | `.mut`, `.up`, `.tbl`, `.fld`, `.opt`, `.sets th`, `.bars span/em`, `#tbar .tl`, `.note`, nav inactiva |
| `--line` | `rgba(120,190,255,.22)` | borde / rejilla | 25 usos: casi todos los bordes y la rejilla de `body::before` |
| `--panel` | `rgba(12,24,50,.62)` | fondo de tarjeta | solo `.panel` (`ui.css:2`) |
| `--acc` | `#fbbf24` (reescrita por cinturón) | **acento dinámico** | 43 usos: botón principal, barras, anillo, nav activa, chips, foco, toast, bordes de arcos |
| `--sc` | `#38bdf8` | acento de sesión/módulo | solo los arcos de `.panel.sc` (`ui.css:7`) y el brillo de `.sess img` (`ui.css:41`) |
| `--ok` | `#34d399` | estado «hecho» | `.chk`, `.ex.done`, semana, flash del temporizador |
| `--warn` | `#fb923c` | aviso | solo `.week .part i` (`ui.css:36`) |
| `--bad` | `#ef4444` | error | **sin uso en CSS** |

### 1.3 Marca fija, acento por módulo y fondos/texto

**Marca fija (rojo brasa / dorado).** *Hoy no existe como token de interfaz.*
- El rojo brasa y el dorado de marca viven solo en el logo: `img/dankai-logo.svg` (variables `--rojo-oscuro #5c0e08`, `--rojo-claro #ff4d2b`, `--oro-oscuro #a8740f`, `--oro-claro #ffd45e`, `--oro #fbbf24`), en los PNG y en `img/logo.webp`.
- El dorado `#fbbf24` coincide con `--acc` por defecto (cinturón amarillo), pero `--acc` cambia con el cinturón: el «acento de marca» **no es fijo** en la app.
- El rojo de la interfaz es `#ef4444` (`--bad`), usado como color de Sparring/artes.

**Acento por módulo** (se pasa como estilo en línea `--acc`/`--sc` dentro del HTML generado):

| Módulo / pantalla | Color | Dónde está escrito |
|---|---|---|
| Comida | `#34d399` | `js/views/comida.js:34` (`--acc` y `--sc`), `js/ui.js:41` (tarjeta de Estado/Misión) |
| Lectura | `#22d3ee` | `js/views/lectura.js:18`, `js/ui.js:41`, `js/views/rutinas.js:8` |
| Sparring / artes | `#ef4444` | `js/views/diario.js:29`, `js/views/hoy.js:37`, `js/views/spar.js:120` (anillo), `js/data.js:82` |
| Gym (y Misión por defecto) | `#38bdf8` | `--sc` en `base.css:3`; `js/data.js:74`, `76` (`gym1`, `gym2`) |
| Calistenia | `#a78bfa` | `js/data.js:78` |
| Trote y Dojo | `#fbbf24` | `js/data.js:80`, `81` |
| Descanso | `#cbd5e1` | `js/data.js:83` |
| Rutinas del usuario (8 a elegir) | `#38bdf8 #fbbf24 #ef4444 #34d399 #a78bfa #fb923c #22d3ee #f472b6` | `js/views/rutinas.js:8` (`COLORES`) |
| Cinturones | `#f1f5f9 #fbbf24 #fb923c #34d399 #38bdf8 #c08457 #94a3b8` | `js/data.js:5-11` (`BELTS`) |

El color de cada rutina se guarda en los datos del usuario (`routines[].color`) y se inyecta en línea: `js/views/estado.js:55`, `js/views/hoy.js:28` y `32` (`background` y `box-shadow` de la barra), `js/views/rutinas.js:123`, `147`.

**Fondos y texto** (literales sueltos en CSS, no son variables):

| Color literal | Usos | Dónde |
|---|---:|---|
| `#020611` | 4 | fondo de imágenes: `.ex img` (44), `.mus` (53), `.thumb` (156), `.mpreview` (158) |
| `rgba(10,20,44,.5)` | 3 | `.ex` (42), `.chip-b` (101), `.feel button` (127) |
| `rgba(2,8,22,.8)` | 3 | `.sets input` (59), `input.nm/.tx/.fld input` (95), `textarea` (129) |
| `rgba(10,20,44,.8)` | 2 | `select.pick` (50), `input[type=date]/month, select.s` (89) |
| `rgba(20,40,80,.5)` | 2 | `.btn` (15), `.mv` (161) |
| `rgba(255,255,255,.08)` | 2 | `.bar` (28), `.ring .bg` (66) |
| `rgba(255,255,255,.03)` | 2 | `.note` (62), `.msg` (93) |
| `rgba(2,8,22,.5)` / `.6` | 1 + 1 | `.mw` (136), `.seg` (122) |
| `rgba(5,11,24,.8)` / `.82` | 1 + 1 | `.mus span` (55), `#nav` (`base.css:39`) |
| `rgba(6,14,32,.94)`, `rgba(10,22,48,.95)` | 1 + 1 | `#tbar > div` (77), `#toast` (`base.css:51`) |
| `rgba(56,120,255,.18)` | 1 | halo azul de `body` (`base.css:11`) |
| `rgba(255,255,255,.02)`, `rgba(0,0,0,.35)` | 1 + 1 | sombra de `.panel` (3) |
| `#000` | 2 | máscara de la rejilla (`base.css:19-20`) |

**Texto sobre colores de acento** (cada uno distinto): `#1a1200` sobre `--acc` (`.btn.pri`, `ui.css:17`); `#03140d` sobre `--ok` (`.ex.done .chk`, `.chk.on`, 48 y 90); `#04121a` sobre `--acc` (`.feel button.on`, 128); `#06101f` en la mezcla de `#tbar.done` (79); `#fff` en la mezcla de `.btn.pri` (17).

**Mezclas con `color-mix(in srgb, …)`**: 18 en CSS (sobre `--acc`, `--sc`, `--ok`): brillos, sombras, fondos tenues. Requieren iOS/Safari 16.2 o más.

**Otros lugares con color**: `<meta name="theme-color" content="#050b18">` (`index.html:6`) y `manifest.webmanifest` (`background_color`, `theme_color`: `#050b18`).

### 1.4 Duplicados y literales sueltos

- **Superficies casi iguales sin token**: 5 variantes de «azul muy oscuro con alfa» (`rgba(10,20,44,.5)`, `…,.8)`, `rgba(2,8,22,.5/.6/.8)`, `rgba(20,40,80,.5)`) + `#020611`, repartidas en 14 selectores. Son candidatas naturales a 3 o 4 tokens de superficie.
- **Alfas de `--bg` repetidas a mano**: `rgba(5,11,24,.8)`, `rgba(5,11,24,.82)`, `rgba(2,8,22,…)` son el fondo con distinta opacidad.
- **Mismo color en dos lugares**: `#fbbf24` (variable `--acc` + 4 literales en `data.js` + `--oro` del SVG), `#38bdf8` (`--sc` + `data.js` + `COLORES`), `#34d399` (`--ok` + comida + `COLORES` + cinturón verde), `#ef4444` (`--bad` + 6 literales en JS).
- **Texto sobre acento**: 3 tintas oscuras distintas (`#1a1200`, `#03140d`, `#04121a`) para el mismo propósito.
- **`--bad` definida y nunca usada** en CSS.
- **Contrastes calculados (WCAG, sobre `--bg`)**: `--ink` 17,1:1; `--mut` 7,7:1 (sobre el fondo de tarjeta ≈ 7,0:1); `--acc` 11,8:1; `--ok` 10,2:1; `#22d3ee` 10,9:1; `#38bdf8` 9,2:1; `#a78bfa` 7,2:1; `#ef4444` **5,2:1** (el más bajo); cinturón marrón 6,3:1. Texto oscuro sobre acento: `#1a1200` sobre `--acc` 11,1:1; `#03140d` sobre `--ok` 9,8:1; `#04121a` sobre `--acc` 11,4:1. (Con transparencias reales el contraste exacto **no está determinado**.)

---

## 2. Tipografía

### 2.1 Familias y carga

- **Una sola familia declarada**: `--font: "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif` (`base.css:5`), aplicada en `html, body` (`base.css:8`). `button, select, input` y `textarea` heredan (`font: inherit`).
- **Excepción**: `.kanji` (`ui.css:175`) usa una pila de fuentes japonesas del sistema (Hiragino Sans, Yu Gothic UI, Yu Gothic, Meiryo, Noto Sans CJK JP, Noto Sans JP, PingFang SC) solo para 段階 en Ajustes → Acerca de (`js/views/estado.js`). El mismo kanji aparece en el texto de novedades (`js/novedades.js`, sin esa clase).
- **De dónde se cargan**: de ningún lado. No hay `@font-face`, ni `<link>` a fuentes, ni archivos de fuente en el repo, ni red. Lo que se ve es la fuente del sistema del dispositivo (Segoe UI en Windows, la del sistema en iOS/macOS, Roboto en Android).
- **Glifos fuera de las fuentes latinas** (hoy caen en la fuente del sistema o emoji): `←` `→` (en 6 y 6 archivos), `⋮` (`instalar.js`), `✎` (`rutinas.js`), `✓` (`clase.js`, `lectura.js`, `spar.js`, `trote.js`), `✕` (`comida.js`, `diario.js`, `rutinas.js`), `💪` (`comida.js`), `段階`.
- Números: se usa `font-variant-numeric: tabular-nums` (`.num`, `base.css:29`; anillo y barra de temporizador). **No determinado** qué fuente futura lo soportaría (ver 9).

### 2.2 Tamaños y pesos (CSS)

20 valores distintos de `font-size` en CSS: 19 en `rem` + `16px` (regla solo iOS, `ui.css:146`).

| Tamaño | Selectores |
|---|---|
| `.66rem` | `.opt` |
| `.7rem` | `#nav a`, `.sets th`, `.bars span` |
| `.72rem` | `.up`, `.week div`, `.bars em` |
| `.74rem` | `.fld` |
| `.78rem` | `.chip` |
| `.8rem` | `#nav a` (≥900 px), `.belt`, `.mus span`, `#tbar .tl` |
| `.85rem` | `.btn.sm`, `.chip-b span` |
| `.86rem` | `.chip-b b` |
| `.9rem` | `.note` |
| `.92rem` | `.msg`, `.vlist li`, `.mdl .mb`, `.pasos` |
| `.95rem` | `textarea` |
| `1rem` | `input.nm`, `input.tx`, `.fld input` |
| `1.05rem` | `.sets input`, `.mv` |
| `1.1rem` | `.stepper b` |
| `1.35rem` | `.head h1` |
| `1.4rem` | `#tbar .tt`, `.mini .num b` |
| `1.5rem` | `.stat b` |
| `2.1rem` | `.lvl` |
| `3.1rem` | `.ring .tm b` |
| `16px` | `input, select, textarea` solo en iOS |

**Además, el HTML generado en JS pone 15 tamaños en línea**, 7 de ellos que no existen en el CSS: `.76rem`, `.82rem`, `.88rem`, `1.15rem`, `1.25rem`, `1.3rem`, `2rem`. Los más repetidos: `.85rem` ×11, `.78rem` ×11, `.8rem` ×10, `.76rem` ×6, `.82rem` ×5, `1.15rem` ×4. **Total real: 26 tamaños distintos en `rem` + `16px`.**

| Peso | CSS | En línea (JS) |
|---|---|---|
| 400 | por defecto | por defecto |
| 500 | `.sets th` | — |
| 600 | `#toast`, `.btn`, `.belt`, `.ex .t`, `.chip-b b`, `.seg button` | ×1 |
| 700 | `.ring .tm b`, `#tbar .tt`, `.bars .today em`, `.feel button`, `.toastbtn` | ×9 |
| 800 | `.lvl` | ×2 |

`h1, h2, h3 { margin: 0; letter-spacing: .04em }` (`base.css:22`); sus tamaños salen de `.head h1` o de estilos en línea (`1.15rem`, `1.25rem`, `1.3rem`); en los demás casos mandan los del navegador. Interletrado en uso: `.04em`, `.08em`, `.12em`, `.14em`.

---

## 3. Forma

### 3.1 `border-radius` (16 valores distintos)

| Valor | Usos | Dónde |
|---|---:|---|
| `10px` | 10 | `.btn`, `.week div`, `.ex img`, `select.pick`, `.sets input`, `input.nm/.tx`, `textarea`, `.feel button`, `.mv`, `.thumb` |
| `12px` | 5 | `.ex`, `.chip-b`, `.seg`, `.sug`, `.mpreview` |
| `var(--r)` = `14px` | 4 | `.panel`, `.mus` y los dos arcos de esquina |
| `99px` / `999px` | 3 + 2 | `.bar`, `.mus span`, `.chip` / `#toast`, `.belt` |
| `50%` | 3 | `.week div i`, `.chk`, `.sw` |
| `0 8px 8px 0` | 2 | `.note`, `.msg` (borde izquierdo de color) |
| `18px`, `16px` | 1 + 1 | `.hero img`, `.sess img` |
| `14px` | 1 | `#tbar > div` (literal, igual que `--r`) |
| `9px`, `8px`, `6px`, `4px`, `6px 6px 0 0`, `inherit` | 1 c/u | `.seg button`, `input[type=date]…`, `.opt`, `.belt i`, `.bars .col i`, `.bar > b` |

En línea (HTML de JS): `border-radius:10px` (`clase.js:22`), `8px` (`estado.js:81`), `18px` (`inicio.js:9`). El `.panel` dentro de modales (`class="panel mdl"`, `js/modal.js`) hereda los mismos radios.

### 3.2 Bordes, sombras y resplandores

- **Borde estándar**: `1px solid var(--line)` en 21 declaraciones. Variante de acento: `1px solid var(--acc)` en `#toast`, `#tbar > div`, `.mus span`, `.sug`; `3px solid var(--acc)` a la izquierda en `.note`, `.msg`; `2px solid var(--acc)` en los arcos y en el `outline` de foco (inputs, `ui.css:60, 98, 130`).
- **`box-shadow` (13 declaraciones)**: todas son resplandor de color (`0 0 Npx var(--acc|--ok)` o `color-mix`) salvo `.panel`: `0 0 0 1px rgba(255,255,255,.02) inset, 0 8px 30px rgba(0,0,0,.35)`. Listado: `.panel` (3), `.btn.pri` (17), `.belt i` (27), `.bar > b` (29), `.week .done i` (35), `.ex.done .chk` (48), `#tbar > div` (77), `@keyframes flash` (80), `.seg button.on` (124), `.chip-b.sel` (125), `.feel button.on` (128), `.sw.on` (155), `.bars .hit .col i` (116), `#toast` (`base.css:52`).
- **`filter: drop-shadow`** (4): `#splash img`, `.hero img`, `.sess img`, `.ring .fg`. **`text-shadow`** (2): `#nav a.on`, `.lvl`.
- **`backdrop-filter: blur`** (3): `#nav` (14px), `.panel` (10px, **en todas las tarjetas**), `#tbar > div` (12px).
- Fondo de página: 2 `radial-gradient` + 1 `linear-gradient` con `background-attachment: fixed` (`base.css:9-15`) y una rejilla `body::before` a pantalla completa con máscara radial (`base.css:16-21`).

### 3.3 Los «arcos de esquina» de las tarjetas

| Dónde | Qué hace |
|---|---|
| `css/ui.css:4` | `.panel::before, .panel::after`: cuadrado de 16×16 px, `border: 2px solid var(--acc)`, `opacity .85`, posición absoluta (`.panel` es `position: relative`, línea 2) |
| `css/ui.css:5` | `.panel::before`: esquina **superior izquierda** (`top/left: -1px`, sin borde derecho ni inferior, `border-top-left-radius: var(--r)`) |
| `css/ui.css:6` | `.panel::after`: esquina **inferior derecha** (`bottom/right: -1px`, `border-bottom-right-radius: var(--r)`) |
| `css/ui.css:7` | `.panel.sc::before, .panel.sc::after { border-color: var(--sc) }`: el color pasa a `--sc` cuando la tarjeta lleva la clase `sc` |

Alcance: **todo elemento con clase `panel`**, que incluye las tarjetas de todas las pantallas, las tarjetas pequeñas de `habitCards()` (`js/ui.js:36`, `class="panel sc mini"`), los modales (`class="panel mdl"` en `js/modal.js`) y la caja de instalación.

**Para quitarlos sin tocar HTML**: alcanza con **borrar o anular `css/ui.css:4-7`** (por ejemplo `.panel::before, .panel::after { content: none }`). Nada en JS depende de esos pseudo-elementos. Consecuencias:
- La clase `sc` queda solo para lo que sí consume `--sc` (`.sess img`, `ui.css:41`); sigue siendo útil como «tarjeta con acento».
- `--r` seguiría gobernando `.panel` y `.mus` (los arcos dejarían de usarlo).
- Si se quisiera conservar los arcos en alguna tarjeta puntual, haría falta una clase nueva en el HTML (tocaría JS).

---

## 4. Componentes

Todo el HTML se genera en **plantillas de texto en JS** (no hay archivos HTML de vistas). El CSS está en `css/ui.css` salvo donde se indica `base`.

| Componente | Selector (CSS) | Dónde se genera (archivo → función) | Comparte estilos con |
|---|---|---|---|
| Tarjeta | `.panel` (+ `.sc`) `ui.css:2-7` | todas las vistas, en línea: `<section class="panel …">` | modal (`.mdl`), `.mini` |
| Tarjeta mini (proteína/lectura) | `.panel.sc.mini` `ui.css:107-110` | `js/ui.js` → `habitCards()` (36) | `.panel`, `.bar` |
| Encabezado de pantalla | `.head`, `.head h1`, `.up` `ui.css:12-13` | cada `render` de `js/views/*.js` | `.up` es global |
| Botón | `.btn`, `.pri`, `.sm`, `.ghost` `ui.css:15-20` | todas las vistas | `.mv`, `.seg button`, `.feel button`, `.chip-b` (parecidos pero cada uno con su regla) |
| Chip informativo | `.chip` (88) | `ui.js` → `exHead`; `comida.js`, `clase.js`, `trote.js`, `spar.js` | — |
| Chip botón (alimentos, presets, tipos de clase) | `.chip-b`, `.chips`, `.chip-b.sel` (100-104, 125) | `comida.js` (`draw`), `trote.js` (`draw`), `clase.js` (`draw`) | — |
| Selector segmentado | `.seg` (122-124) | `trote.js` y `spar.js` (`draw`) | — |
| Escala 1-5 | `.feel` (126-128) | `ui.js` → `feelHTML` / `feelBind` | — |
| Barra de progreso | `.bar > b` (28-29) | `estado.js`, `hoy.js`, `comida.js`, `lectura.js`, `ui.js` | `.ring .bg` usa el mismo gris |
| Gráfico de barras (7 días) | `.bars` (111-119) | `comida.js` → `chart()` (21) | — |
| Anillo del temporizador | `.ring`, `.tm` (63-69) | `ui.js` → `ringHTML` / `ringSet` (57-59); usado en `ejercicio.js`, `trote.js`, `spar.js` | — |
| Pasos de cantidad | `.stepper` (70-71) | `ejercicio.js`, `trote.js`, `spar.js`, `comida.js` | — |
| Círculos de series | `.chk` (47-48, 61, 90) | `ejercicio.js` (tabla `.sets`), `hoy.js` (lista de la misión) | misma clase con dos tamaños (28 px y 38 px) |
| Tabla de series | `.sets` (56-61) | `ejercicio.js` (`render`, rama `sets`) | `.chk`, inputs |
| Ejercicio en lista (Misión, Más) | `.ex`, `.ex .t`, `.ex.done`, `.opt` (42-49) | `hoy.js` (`render`), `mas.js` (`.ex.mnu`) | `.mnu` cambia las columnas (131) |
| Imagen de músculo | `.mus` (53-55), `.thumb`, `.mpreview` | `ui.js` → `exHead`, `muscleImg` (14); `rutinas.js` | — |
| Sugerencia de peso | `.sug` (151-152) | `ejercicio.js` (`sugHTML`) | — |
| Mensaje / nota | `.msg` (93), `.note` (62) | `comida.js`, `estado.js`, `lectura.js`, `rutinas.js`, `trote.js` / `ejercicio.js`, `diario.js`, `spar.js`, `trote.js` | casi idénticos entre sí |
| Campos | `.fld`, `input.nm/.tx`, `select.pick/.s`, `textarea`, `.qe` (50, 89, 94-99, 129) | `comida.js`, `lectura.js`, `diario.js`, `rutinas.js`, `estado.js` | todos usan `rgba(2,8,22,.8)` o `rgba(10,20,44,.8)` |
| Fila de lista | `.li`, `.row`, `.sp` (9-10, 105-106) | casi todas las vistas | — |
| Semana | `.week` (32-37) | `estado.js` → `weekStrip()` (11); la clase `part` se arma como texto, no figura literal | — |
| Héroe de Estado | `.hero`, `.lvl`, `.belt`, `.stat` (23-31) | `estado.js` (`render`) | — |
| Cabecera de sesión | `.sess` (40-41) | `hoy.js`, `comida.js`, `lectura.js`, `rutinas.js` | — |
| Hoja/overlay modal | `.mw`, `.mdl`, `.mb` (134-142, 164-169) | `js/modal.js` → `abrirModal`; usado por `aviso.js`, `instalar.js`, `rutinas.js` (tres diálogos) | es un `.panel` |
| Toast | `#toast`, `#toast.act`, `.toastbtn` (`base.css:50-53`, `ui.css:171-172`) | `js/app.js` → `toast()` (62) | — |
| Navegación inferior / lateral | `#nav`, `#nav a` (`base.css:36-42`, ≥900 px: lateral de 200 px) | `app.js` → `buildNav()` (53); íconos SVG en `ICON` | — |
| Barra global de temporizador | `#tbar` (`ui.css:76-83`) | `app.js` → `renderBar()` (127) | también es la «caja de descanso» (ver nota) |
| Splash | `#splash` (`base.css:45-48`) | `index.html` + `app.js:182` (agrega `off` a los 700 ms) | — |
| Selector de color/imagen de rutina | `.swatches`, `.sw`, `.mv`, `.mvs` | `rutinas.js` | `.mv` parecido a `.btn` |
| Listas de novedades | `.vlist`, `.pasos` | `novedades.js`, `instalar.js`, `bloqueo.js` | — |

**Nota — «caja de descanso»**: no existe un componente propio. El descanso entre series es un temporizador de tipo `rest` que se muestra en la **barra global `#tbar`** (`app.js` → `renderBar`, con `−15 s`, `+15 s` y `Saltar`) y, en la pantalla del ejercicio, la tarjeta «Temporizadores» (`.panel` + `.stepper`, `ejercicio.js`). Comparte todos los estilos de `#tbar`.

Clases sin uso literal en JS/HTML: `.part` (se compone dinámicamente en `estado.js`). `.out` y `.act` se agregan por JS (`modal.js`, `app.js`).

---

## 5. Vistas

### 5.1 Cómo se actualiza una pantalla (mecanismo común)

1. `js/app.js` → `route()` (96): resuelve la ruta por `location.hash`, elige el módulo de la vista (`VIEWS`, `SPECIAL`) y llama `mod.render(root, ctx, arg)`.
2. Cada vista arma un **string HTML** y lo asigna con `root.innerHTML = …`.
3. `js/morph.js` intercepta esa asignación (`Object.defineProperty(root, 'innerHTML', …)`, `morph.js:10-25`): la **primera** asignación tras `pantallaNueva()` reemplaza todo; **las siguientes** se aplican por diferencias (`morph()`).
4. `ctx.refresh()` = `route({ refresh: true })` (`app.js:82`): vuelve a ejecutar `render` de la misma pantalla y morfea; `ctx.commit()` solo calcula y muestra XP.
5. Varias vistas tienen su propio `draw()` interno (cierre con estado local: `qty`, `edit`, `finishing`, `paso`, `adding`) que reasigna `root.innerHTML`; también pasa por el morph.

### 5.2 Tabla de vistas

| Pantalla | Archivo → función | Reasigna `innerHTML` | Cómo se enlazan los eventos tras cada render |
|---|---|---|---|
| **Estado** | `js/views/estado.js` → `render` (24) | una vez por `render`; se redibuja con `ctx.refresh()` (9 llamadas) | helper `on(selector, evento, fn)` con `addEventListener`; interruptores de módulos con `querySelectorAll('[data-mod]')…addEventListener`; tarjeta de instalar con `tarjetaBind` (`instalar.js`, props `onclick`) |
| **Ajustes** | sección `<section id="ajustes">` dentro de `estado.js`; entrada profunda `#/estado/ajustes` (scroll en `app.js`) | igual que Estado | igual que Estado (`#belt`, `#since`, `#exam`, `#dojon`, `#dojologo`, `#descAuto`, `#exp`, `#imp`, `#rst`) |
| **Misión** | `js/views/hoy.js` → `render` (9) | una vez; dos ramas excluyentes (sin rutina / con rutina) | `addEventListener` en `#pick` y la lista; no usa `draw()` |
| **Comida** | `js/views/comida.js` → `render` (28), `draw` (32), `bind` (81), `chart` (21) | cada `draw()`; acciones llaman `after()` = `ctx.commit()` + `ctx.refresh()` | props `onclick`/`onchange` (12) reasignadas en `bind()` |
| **Lectura** | `js/views/lectura.js` → `render` (11), `draw` (15), `bind` (68) | cada `draw()` | props `onclick`/`onchange` (7); `T.sub` para el botón del cronómetro (devuelve la función de limpieza) |
| **Más** | `js/views/mas.js` → `render` (16) | una vez | prop `onclick` en `#inst`; el resto son enlaces `<a href>` |
| **Clase** (artes) | `js/views/clase.js` → `render` (9), `draw` (16), `bind` (38) | cada `draw()` | props `onclick` (5) |
| **Sparring** | `js/views/spar.js` → `render` (33), `draw` (41), `bind`, `controls`, `paint`; usa `diario.js` para el formulario | 2 sitios; cada `draw()` | props `onclick`/`onchange` (14); `T.sub` para repintar el anillo |
| **Trote** | `js/views/trote.js` → `render` (13), `draw` (38), `bind` (73) | 2 sitios; cada `draw()` | props `onclick` (12); `T.sub` |
| **Diario / Historial** | `js/views/diario.js` (`render` 21, `draw` 25), `historial.js` | `draw()` / una vez | props `onclick` (5) / ninguno |
| **Rutinas** (y editor) | `js/views/rutinas.js` → `render` (16), `lista` (119), `editor` (142), `draw` (174) + 3 diálogos | 3 sitios; cada `draw()` (`rr()` = guardar + `draw`) | mezcla: props `onclick` (14) y `addEventListener` (4); los diálogos viven fuera de `#view` |
| **Ejercicio** | `js/views/ejercicio.js` → `render` (16) | `#view` una vez; además `tb.innerHTML` (contenido de `#tb` propio del código) | `addEventListener` (12) y `T.sub`; cada fila de series enlaza sus inputs y su círculo |
| **Plan** | `js/views/plan.js` → `render` (6) | una vez | `addEventListener` por `select[data-d]` |
| **Primera vez** | `js/views/inicio.js` → `render` (5), `draw` (8), `bind` (26) | cada `draw()` | props `onclick`/`onchange` + un `addEventListener` |
| **Novedades** | `js/views/novedades.js` → `render` (7) | una vez | prop `onclick` en `#ver` |
| **Bloqueo** | `js/views/bloqueo.js` → `render` (4) | una vez | props `onclick` |

**Fuera de `#view` (no pasan por el morph)**: la barra `#nav` (`app.js:buildNav`, se reescribe entera cuando cambia la firma de ítems), la barra `#tbar` (`renderBar`: `innerHTML` completo si cambia la firma `modo|pausa|fin|fase`, y solo `textContent` en cada tick), `#toast`, los modales (`modal.js`) y `#splash`.

### 5.3 Puntos frágiles de `js/morph.js`

1. **Interceptación global de `addEventListener`** (`morph.js:12-19`): se parchea `EventTarget.prototype.addEventListener` para registrar, por nodo, los listeners agregados dentro de `#view`. Solo se registran elementos dentro de `raiz`; todo lo que se agregue a `document`/`window` o fuera de `#view` no se toca. Es un parche de alcance global del navegador.
2. **Los listeners de nodos reutilizados se sueltan en cada refresh** (`soltar`, `morph.js:30-34`) y se espera que la vista **vuelva a enlazarlos todos**. Un enlace condicional (`if (!edit) return;` antes de enlazar) deja nodos reutilizados sin handler.
3. **Propiedades `onXXX`**: solo se limpian las de la lista `ON` (`onclick onchange oninput onkeydown onkeyup onfocus onblur onsubmit onpointerdown ondblclick`, `morph.js:5`). Cualquier otra (`ontouchstart`, `onkeypress`, …) no se suelta.
4. **Nodos preservados vs. contenido manejado por JS**: el morph vuelve a dejar el HTML de la plantilla. Lo que el código llena después (`#tb` en ejercicio/trote/spar, texto de `#rt`/`#rs`, atributo `style`, `data-sig`/`data-s`) **se pisa**; `data-*` se conserva (regla `PROPIOS`) y puede quedar desfasado: ya hubo un bug (botonera vacía), arreglado con `!tb.childElementCount` (`ejercicio.js:138`, `spar.js:102`, `trote.js:107`). Cualquier componente nuevo que se llene por JS tiene el mismo riesgo.
5. **Atributos que se borran**: se quitan los que no están en el HTML nuevo, salvo `data-*` y `stroke-dashoffset` (`morph.js:40-43`); un `style` puesto por JS (por ejemplo `r.style.stroke` del anillo de `spar.js`) se pierde en cada morph y se repone en el siguiente `paint`.
6. **Emparejamiento por posición**: solo se reconocen nodos por `id`; el resto se empareja por índice y etiqueta. En listas sin `id` (entradas de comida, filas de rutinas, ejercicios), insertar/quitar en el medio reutiliza el nodo equivocado: se conserva el foco y las clases «por posición», no «por elemento».
7. **Campos**: un `input` enfocado no se toca; los demás vuelven al `value` del HTML (`morph.js:56-57`), así que el texto a medio escribir en un campo **no enfocado** se pierde en un refresh. `select`: solo se ajusta si no está enfocado; `<option>` por posición.
8. **Bandera global `nueva`** (`morph.js:8`, `pantallaNueva`): si una vista no asigna `innerHTML` en su primer render (redirección con `location.hash`) la bandera queda activa y la próxima asignación de otra pantalla reemplaza todo en lugar de morfear.
9. **Animación de entrada**: `#view` tiene `animation: in` (`base.css:33`); se reinicia solo en pantallas nuevas (`app.js:117`, forzando reflujo). Un cambio de estructura que recree `#view` la reiniciaría.
10. **Sin soporte** para `<details>`, `<dialog>`, `contenteditable` ni canvas dentro de `#view`: cualquier nodo con estado propio dentro de `#view` hay que tratarlo con cuidado (por ejemplo, un lienzo de efectos debería vivir fuera de `#view`).

---

## 6. Animaciones y transiciones

| Dónde | Efecto | Duración | Propiedad |
|---|---|---|---|
| `#view` (`base.css:33-34`) | `@keyframes in`: entra desde abajo | `.28s ease both` | `opacity`, `transform` |
| `#splash` (`base.css:45`) | desvanecido al salir | `.6s ease` | `opacity`, `visibility` |
| `#splash img` (`base.css:46-48`) | `@keyframes pulse` infinita | `1.4s ease-in-out infinite` | `transform: scale(1.06)` |
| `#toast` (`base.css:52`) | entrada/salida | `.3s` (todas las propiedades) | `opacity`, `transform` |
| `.btn` (`ui.css:15`) | respuesta al tocar | `.15s` (todas) | `transform` (`:active scale(.97)`), color |
| `.bar > b` (`ui.css:29`) | crece la barra | `.6s ease` | `width` |
| `.ring .fg` (`ui.css:67`) | avance del anillo | `.25s linear` | `stroke-dashoffset` |
| `#tbar.done > div` (`ui.css:79-80`) | `@keyframes flash` ×3 al terminar | `1s ease 3` | `box-shadow` |
| `.mw` / `.mdl` (`ui.css:135, 138`) | entrada del modal | `.25s ease` | `opacity` / `transform: scale(.96→1)` |

- **`prefers-reduced-motion`**: sí se respeta. `css/base.css:63` apaga **toda** animación y transición con `* { animation: none !important; transition: none !important }`; `ui.css:143` repite el caso del modal, la barra y el anillo (redundante pero inocuo).
- **Parpadeo**: con el morph (2.2.1) el redibujado de la misma pantalla ya no reinicia `#view` ni reemplaza nodos. Quedan estos puntos sensibles: (a) `renderBar` reescribe todo el `#tbar` cuando cambia la firma (cambio de fase, pausa), con pérdida de foco/hover de sus botones; (b) `#nav` se reescribe entero al cambiar módulos; (c) `transition: .3s` y `.15s` aplican a **todas** las propiedades y animan cambios de clase que no deberían animarse; (d) `.bar > b` anima el ancho en cada morph (es deseable, pero parece un «salto» si cambia el valor de golpe); (e) el splash se cierra a un temporizador fijo de 700 ms (`app.js:182`) sin esperar a que la primera pantalla esté lista. **No determinado** si alguno es visible a ojo en dispositivos reales (no se probó en un teléfono).

---

## 7. Peso y rendimiento

### 7.1 Archivos del caché offline (`CORE` de `sw.js`)

`CORE` tiene **58 entradas** pero `'./'` e `'index.html'` son el mismo archivo: **57 archivos distintos, 813.131 bytes (≈ 794 KB)**. `sw.js` no está en `CORE`. Fuentes: **0 bytes** (no hay).

| Tipo | Archivos | Bytes | % |
|---|---:|---:|---:|
| Imágenes `webp` (`img/*.webp`, incluye `logo.webp`) | 18 | 572.574 | 70,4 % |
| JS (`js/**`) | 31 | 169.470 | 20,8 % |
| Íconos `png` (`icons/*`) | 4 | 49.762 | 6,1 % |
| CSS | 2 | 19.517 | 2,4 % |
| HTML + manifest | 2 | 1.808 | 0,2 % |

Texto (JS + CSS + HTML + manifest + `sw.js`): 193.054 B sin comprimir, **≈ 74,6 KB con gzip** (GitHub Pages sirve comprimido).

### 7.2 Las 10 cosas más pesadas

| # | Archivo | Bytes |
|---:|---|---:|
| 1 | `img/mus-hombros.webp` | 58.896 |
| 2 | `img/mus-dorsales.webp` | 55.934 |
| 3 | `img/mus-pecho.webp` | 45.748 |
| 4 | `img/mus-agarre.webp` | 42.838 |
| 5 | `img/mus-core.webp` | 42.340 |
| 6 | `img/mus-deltoide.webp` | 42.194 |
| 7 | `img/mus-cuadriceps.webp` | 40.960 |
| 8 | `img/mus-isquios.webp` | 36.674 |
| 9 | `img/mus-biceps.webp` | 36.124 |
| 10 | `img/sec-trote.webp` | 23.962 |

Siguientes: `sec-gym.webp` 22.910, `sec-cuerpo.webp` 21.966, `icons/icon-512.png` y `icons/maskable-512.png` (idénticos, 19.774 c/u), `img/logo.webp` 17.440, `js/views/rutinas.js` 16.468 (el JS más grande). Las 9 imágenes `mus-*` suman 401.708 B (≈ 392 KB): casi la mitad del peso total.

### 7.3 Costos de pintado (por lectura del CSS)

- `backdrop-filter: blur(10px)` en **cada** `.panel` (decenas por pantalla) + `#nav` + `#tbar`; fondo `fixed` con tres gradientes y una rejilla `body::before` a pantalla completa con `mask-image`; 13 `box-shadow` y 4 `drop-shadow`. Es lo más probable que cueste en teléfonos modestos y en iOS al desplazar.
- `color-mix()` en 18 declaraciones (compatibilidad: Safari 16.2+).
- **No determinado**: fotogramas por segundo, tiempo de pintado o consumo real; no se midió en un dispositivo.

---

## 8. Riesgos y división propuesta de la 2.3.0

### 8.1 Qué es solo CSS y qué toca lógica

**Solo CSS** (sin tocar JS): tokens de color/forma/tipografía en `:root`; reemplazar literales dentro de `css/*.css`; quitar los arcos (`ui.css:4-7`); unificar radios, sombras y escalas de tamaño; cambiar `--r`; reglas de `.panel`, `.btn`, `.chip-b` y similares.

**Toca JS/HTML generado (no es solo CSS):**
- los 244 `style=` dentro de las plantillas (márgenes, tamaños `rem`, pesos, colores de módulo): un cambio de tokens no los alcanza;
- el acento dinámico: `theme()` (`app.js:75-77`) + `BELTS` + colores de rutina y de módulo en línea. Definir una «marca fija» roja/dorada exige decidir qué pasa con el color del cinturón y con los acentos por módulo (diseño + código);
- fuentes locales: `index.html`, `sw.js` (`CORE` y versión de caché) y, para cachear bien, quizá la estrategia de `fetch` del service worker;
- transición de pantalla: `route()` (`app.js:96-125`), la animación de `#view` y su interacción con `morph.js`;
- Misión compacta / modo sesión: `hoy.js` (HTML) y probablemente `ejercicio.js` y la navegación (lógica nueva);
- efectos y «humo»: capas nuevas (probablemente `canvas`) que no pueden vivir dentro de `#view` por el morph, y costo de rendimiento.

### 8.2 División propuesta (de menor a mayor riesgo)

Cada paso es un commit/versión que se puede revertir con `git revert` sin afectar a los demás, y se publica solo si pasa su prueba. Antes de empezar: guardar capturas de referencia a 390×844 (Estado, Misión, Comida, Lectura, Más, Rutinas, Ejercicio, Ajustes, modal) y repetir la prueba de datos de las versiones anteriores (XP 1667, nivel 6, racha 2 con el estado de 12 días).

| Paso | Alcance | ¿Toca lógica? | Criterio de «terminado» | Prueba |
|---|---|---|---|---|
| **2.3.0a — Tokens** | Variables nuevas en `:root`: marca fija (rojo/dorado), superficies (3-4), texto sobre acento (1), escala de tamaños, radios; reemplazar los literales **dentro del CSS**. Sin cambio visual. | No (solo CSS) | Ningún color literal fuera de `:root` en `css/*.css`; mismas capturas | Comparación de píxeles antes/después en las 9 vistas (tolerancia mínima); contraste igual o mayor que el de 1.4 |
| **2.3.0b — Tarjetas sin arcos y radios** | Anular `ui.css:4-7`; unificar los 16 radios a una escala corta | No (solo CSS) | Ninguna tarjeta (ni modal) con arcos; radios dentro de la escala | Capturas; recorrer todas las pantallas y modales; `grep` sin `::before/::after` de `.panel` |
| **2.3.0c — Fuentes locales** | `fonts/` + `@font-face` + precarga + `CORE`/`V` (sección 9). Con la pila actual como respaldo | Toca `sw.js` e `index.html` (no la lógica de la app) | Fuentes en el caché offline; sin parpadeo de fuente apreciable; peso añadido ≈ 66 KB | Sin conexión tras instalar; capturas; verificar números tabulares en temporizadores; glifos fuera del subconjunto (`← → ✓ ✕ ✎ ⋮`) con respaldo correcto |
| **2.3.0d — Transición única de pantalla** | Una sola animación por navegación; ninguna al refrescar; mantener `prefers-reduced-motion` | **Sí**: `app.js` `route()`, relación con `morph.js` | Una animación por cambio de pantalla; 0 en `ctx.refresh()` | Prueba de identidad de nodos de 2.2.1 (misma `Animation`, mismos nodos); modo de movimiento reducido |
| **2.3.0e — Misión compacta y modo sesión** | Rediseño de la lista de la Misión y del flujo de sesión | **Sí**: `hoy.js`, `ejercicio.js`, navegación y estado | XP/racha idénticos; ningún ejercicio queda inaccesible; el morph conserva foco | Estado de 12 días (XP, nivel, racha, XP por día); tilde automático + Deshacer; descanso; recorridos completos |
| **2.3.0f — Efectos y humo en Ajustes** | Capa decorativa fuera de `#view`, con apagado y `prefers-reduced-motion` | **Sí**: JS nuevo y rendimiento | Efecto apagable; 0 trabajo con la pantalla oculta o con movimiento reducido | Medición de fotogramas en un teléfono real (hoy **No determinado**); batería; sin errores de consola |

Diferencias con el borrador del encargo: separé las fuentes (2.3.0c) de los tokens (2.3.0a) porque las fuentes tocan el service worker y los tokens no; así el primer paso queda 100 % CSS.

---

## 9. Fuentes locales: Rajdhani (600/700) y Hanken Grotesk (400/500/600/700)

**Tamaños medidos** (consultados en `fonts.gstatic.com`, subconjunto `latin` de Google Fonts, formato `woff2`):

| Fuente | Archivo | Tamaño |
|---|---|---:|
| Hanken Grotesk 400/500/600/700 | **un solo** `woff2` variable (Google entrega la misma URL para los 4 pesos) | 34.704 B |
| Rajdhani 600 | `woff2` estático | 15.732 B |
| Rajdhani 700 | `woff2` estático | 15.688 B |
| **Total** | 3 archivos | **≈ 66,1 KB** |

- El subconjunto `latin` de Google cubre `U+0000-00FF` (incluye **ñ, vocales con tilde, ü, ¿, ¡, ·, ×**), `U+2000-206F` (comillas, guiones, viñetas, puntos suspensivos), `U+2191`, `U+2193`, `U+2212` (−), `U+20AC`, `U+2122`. **No cubre** `←` `→` `✓` `✕` `✎` `⋮` `💪` ni el kanji: seguirán saliendo de la fuente del sistema (aceptable; el kanji debe seguir así).
- `latin-ext` no hace falta para español. (`latin-ext` pesaría 19.588 B para Hanken y 12.964 B para Rajdhani 700.)
- **Reducir más** (subconjunto propio solo con ASCII + Latin-1 + puntuación usada): probablemente baje cada archivo, pero **No determinado** cuánto: no está instalada la herramienta de subconjuntos (`fonttools`/`pyftsubset`) en esta máquina y no se probó. Estimar a ojo sería suponer.
- **No determinado**: si Rajdhani y Hanken traen la característica `tnum` (dígitos de ancho fijo). Hoy los temporizadores dependen de `font-variant-numeric: tabular-nums` (`.num`, `.ring .tm b`, `#tbar .tt`). Hay que verificarlo en los archivos antes de elegir la fuente de los números.

**Qué haría falta, paso a paso**

1. Descargar los `woff2` desde Google Fonts (o `fontsource`) y guardarlos en `fonts/`: `fonts/hanken-grotesk-latin-var.woff2`, `fonts/rajdhani-600-latin.woff2`, `fonts/rajdhani-700-latin.woff2`. Incluir las licencias OFL de cada familia junto a los archivos (ambas se distribuyen bajo OFL en Google Fonts; **confirmar el texto de licencia al descargar**) y mencionarlas en `README.md`.
2. Declarar en `css/base.css`, arriba de todo, con **rutas relativas al CSS** (`../fonts/…`, el sitio vive en una subruta):
   - `@font-face { font-family: "Hanken Grotesk"; font-weight: 400 700; font-display: swap; src: url("../fonts/hanken-grotesk-latin-var.woff2") format("woff2"); }`
   - dos `@font-face` de `Rajdhani` (600 y 700) con `font-display: swap`.
   - Definir tokens `--font-cuerpo` y `--font-titulos` y poner la pila del sistema actual como respaldo (`"Hanken Grotesk", "Segoe UI", system-ui, …`).
3. Precarga en `index.html` solo de lo crítico (Hanken variable y Rajdhani 700): `<link rel="preload" href="fonts/…woff2" as="font" type="font/woff2" crossorigin>` (el atributo `crossorigin` es obligatorio aunque sea el mismo origen).
4. Service worker (`sw.js`): agregar las 3 rutas a `CORE` y subir `V`, así quedan en el caché offline desde la instalación. Nota: el `fetch` del service worker hoy es **red primero con `cache: 'no-cache'`** (revalida siempre); para fuentes inmutables conviene **caché primero** en `/fonts/` (GitHub Pages solo entrega `max-age=600`). Eso es un cambio de lógica del service worker, pequeño pero a probar.
5. Medir antes y después: peso añadido (≈ +66 KB, +8 % sobre los 794 KB actuales), primera pintura sin parpadeo de fuente y funcionamiento sin conexión.

---

## 10. Resumen de hallazgos y límites de esta auditoría

- Estilo = **2 CSS (19,5 KB)** + **244 estilos en línea** dentro de plantillas JS. Hay variables en `:root`, pero faltan tokens de superficie, tintas sobre acento, tamaños y radios; hay **26 tamaños de letra** y **16 radios** distintos.
- **No existe acento de marca fijo**: `--acc` cambia con el cinturón y los módulos pisan `--acc`/`--sc` en línea.
- Los arcos de esquina son 4 líneas de CSS (`ui.css:4-7`), quitables sin tocar HTML.
- No hay fuentes propias; todo usa la fuente del sistema.
- El morph tiene 10 puntos frágiles (5.3); los más delicados son los listeners reenlazados en cada refresh, el contenido que llena JS dentro de nodos reutilizados y el emparejamiento por posición.
- Peso del caché offline: 794 KB, 70 % imágenes; fuentes locales sumarían ≈ 66 KB.

**No determinado**: rendimiento real (FPS, pintado, batería); contraste exacto con transparencias; tamaño de las fuentes tras un subconjunto propio; si las fuentes elegidas traen números tabulares; si algún parpadeo restante se ve a ojo en un teléfono real.
