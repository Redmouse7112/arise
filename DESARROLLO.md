# Dankai — contexto de desarrollo

App personal de entrenamiento de Javier ("RED"), 20 años, kickboxer (cinturón amarillo, rendido en agosto 2026; examen en marzo 2027), desarrollador y estudiante. PWA offline, estilo "sistema holográfico" inspirado en Solo Leveling pero con identidad propia (cinturones, rojo y dorado). Idioma de la interfaz y del código visible: español rioplatense.

## Reglas de diseño (innegociables)
- Sin frameworks ni librerías externas. HTML, CSS y JS vanilla con módulos ES. Lo más liviano posible.
- Código limpio y modular. Un archivo por responsabilidad.
- Funciona offline: localStorage para datos, service worker para la app. IndexedDB solo para fotos (V3).
- El sitio vive en https://redmouse7112.github.io/arise/ (subruta) y los cambios se publican con push a `main`, así que **todas las rutas son relativas** (sin `/` inicial).
- Entregar archivos completos y listos; el usuario itera con feedback puntual y pide explicaciones solo si las necesita.
- Los datos viven solo en el dispositivo. Nada de servidores ni cuentas.
- Los commits y pull requests son solo del autor del repositorio, sin firmas ni coautores.

## Nombre y logo
- La app se llama **Dankai** (段階: "etapa", "peldaño"; contiene "dan", el grado de cinturón). Antes se llamaba Arise.
- **Prefijo legado `arise.`**: las claves de `localStorage` (`arise.v1`, `arise.v1.bak*`, `.preimport`, `.corrupto`, `arise.seen`, `arise.timer`, `arise.instalada`, `arise.instalar`) y el prefijo `arise-` del caché del service worker son identificadores internos del nombre anterior. **No se renombran**: hacerlo dejaría sin datos a las instalaciones existentes. El repositorio y la URL de GitHub Pages también siguen con `arise` hasta que se decida aparte.
- Todo texto visible dice Dankai. Los archivos de copia son `dankai-backup-AAAA-MM-DD.json`; la importación no mira el nombre, así que sigue aceptando los `arise-*.json` viejos. El nombre con kanji se muestra en Ajustes → Acerca de con la fuente japonesa del sistema (`.kanji`); no se incluyen fuentes CJK.
- **Logo provisional; para cambiarlo, editar el SVG y correr el script.** La fuente de verdad es `img/dankai-logo.svg` (colores como variables CSS al inicio del archivo, escalones dentro de `<g id="escalones">`). `tools/make-icons.py` (necesita Pillow: `pip install pillow`; se corre con `python tools/make-icons.py` desde la raíz) lee ese SVG y regenera `icons/icon-192.png` (también es el favicon), `icon-512.png`, `maskable-512.png`, `apple-touch-icon.png` (180, sin transparencia) e `img/logo.webp` (transparente). `tools/` y el SVG **no** se cargan desde la app ni están en `CORE` de `sw.js`: no se descargan ni se guardan sin conexión; al cambiar el logo hay que subir `V` en `sw.js` porque cambian los PNG y el webp.
- Diseño: tres escalones que suben de izquierda a derecha (peldaños = 段階); los dos primeros en rojo brasa (degradado de oscuro abajo a brillante arriba, `#5c0e08` → `#ff4d2b`), el tercero dorado (`#a8740f` → `#ffd45e`) con una franja fina dorada (`#fbbf24`) encima, como un grado. Esquinas superiores redondeadas, fondo oscuro de la app (`#0a1630` → `#050b18`), sin texto ni arcos.
- Fidelidad: el SVG dibujado en un navegador y los PNG publicados difieren en promedio 0,7/255 (99 % de los píxeles a menos de 8/255; las mayores diferencias son píxeles de borde), y los íconos regenerados por el script respecto de los anteriores, 0,08/255.

## Estructura
```
index.html            entrada, splash, nav, barra de temporizador
manifest.webmanifest  PWA
sw.js                 caché; subir la versión V al cambiar archivos
css/base.css          variables, fondo, layout, nav
css/ui.css            componentes (panel, botones, series, anillo, barra)
js/app.js             router por hash, toasts, barra global de temporizador
js/data.js            cinturones, imágenes, ejercicios base (EX), sesiones de ejemplo (SESS), plan de ejemplo
js/store.js           estado en localStorage ('arise.v1'), migraciones, fechas, registro del día
js/rutinas.js         rutinas, ejercicios editables, congelado por día y sugerencia de peso (funciones puras sobre S)
js/xp.js              XP, nivel, racha (se calcula desde el registro)
js/habitos.js         datos de Comida y Lectura (proteína, libros, páginas, XP); sin interfaz
js/entreno.js         datos de trote, dojo y diario de sparring; sin interfaz
js/novedades.js       registro de cambios para el usuario (NOVEDADES); js/aviso.js: ventana de novedades
js/modal.js           ventana pequeña centrada reutilizable (`abrirModal`)
js/morph.js           actualiza #view por diferencias (sin parpadeo); js/imagen.js: reducir imagen a 256 px
img/dankai-logo.svg   fuente del logo; tools/make-icons.py (solo desarrollo, fuera de la app y del caché) genera los íconos
js/instalar.js        botón de instalación (beforeinstallprompt), pasos para iOS y ayuda por navegador
js/timer.js           motor común de temporizadores (descanso, ejercicio con tiempo, rondas, lectura) con horas absolutas
js/ui.js              helpers de vistas
js/views/*.js         estado, hoy, comida, lectura, mas, plan, ejercicio, novedades,
                      historial (trote), diario (sparring), rutinas, inicio (primera vez), bloqueo (datos más nuevos);
                      pantallas propias de ejercicio: trote, clase, spar
img/                  WebP optimizados (sec-* emblemas, mus-* músculos)
```

## Modelo de datos (`localStorage['arise.v1']`, esquema `v: 4`)
- `profile {belt, since, exam}`; `plan[0..6]` (domingo=0) con id de rutina (`''` = sin rutina); `over[fecha]` rutina elegida para ese día.
- `routines [{id, n, color, img, bonus, ex:[ids]}]`: las rutinas son datos del usuario (se siembran desde `SESS`). `bonus` no se edita: sale de la cantidad de ejercicios obligatorios (`bonusPara`).
- `exo {id: {n, sets, reps, rest, dur, note, inc}}`: ediciones de ejercicios base (solo las diferencias; `data.js` queda como valor por defecto). `custom {c_<timestamp>: {id, n, type, muscle, sets, reps, rest, dur, note, inc}}`: ejercicios propios. El XP no es editable: los base conservan `xp`, los propios salen del tipo (`xpCustom`: sets 25, check 30, timed 10 a 40 según minutos).
- `mods {gym, cal, trote, comida, lectura, artes}`: módulos visibles (opcional y aditivo: si falta o una clave falta, está activo). `dojo {log, nombre, logo}`: `log` es el registro de clases; `nombre` y `logo` (data URL de hasta 256 px) los carga el usuario en Ajustes y nunca se migran solos. Las rutinas pueden traer `mod` (opcional; sin él se deduce del id con `MOD_BASE`, y el descanso no tiene módulo).
- `setup`: `'pendiente'` en una instalación nueva hasta elegir "rutina de ejemplo" o "vacío" (`views/inicio.js`); las instalaciones existentes migran con `'listo'`.
- `log[fecha] = { s: rutina, f: copia congelada, ex: { id: { sets:[{w,r,d}], n, done, t } } }`. **Regla del congelado:** la primera vez que se toca un día (`entry`), `f` guarda la sesión de ese día (`n`, `bonus`, `color`, `img` y por ejercicio `id, n, type, xp, sets, reps, rl, rest, dur, opt, muscle`). El XP, la racha y "sesión completa" (`dayStats`) leen SOLO de `f`, nunca de las rutinas vivas, así que editar rutinas o ejercicios no altera el pasado. Un día con registro no se vuelve a congelar, salvo que el usuario elija otra rutina para hoy (`setSession`).
- `last[id] = {w, r}` últimos valores; `prefs[id] = {dur, rest}` tiempos editados.
- `food {goal, kcal, quick:[{id,n,g}], log:{fecha:[{n,g,t}]}, gl:{fecha:meta}}`: `g` = gramos de proteína; `gl` congela la meta del día al cargar la primera comida.
- `read {goal, current, books:[{id,t,a,pages,cur,done}], log:{fecha:{pages,min}}, gl:{fecha:meta}}`: `done` = fecha en que se terminó (o null); `current` = id del libro actual.
- `run {log:{fecha:{mode:'cont'|'int', min, km, feel}}}`; `dojo {log:{fecha:{type, effort, notes}}}`; `spar {log:[{id, date, rounds, feel, good, bad, work}]}`.
- Migración en `store.js` (`migrate`): conserva todo y agrega lo que falte; antes de migrar guarda una copia de los datos previos en `arise.v1.bak<versión>` (`bak1`, `bak2`).
- Aparte del estado principal: `arise.seen` (última versión de novedades vista) y `arise.timer` (temporizador activo).
- Migración v3 → v4 (`rutinas.js` `aV4`): copia `SESS` a `routines` (mismos ids) y congela cada día existente desde las definiciones de ese momento; el XP, el nivel y la racha no cambian (verificado antes/después con datos de ejemplo). Se guarda `arise.v1.bak3` antes.
- Cambios de esquema: subir `v` y migrar en `load()`; nunca romper datos existentes.

## Temporizadores
- Un solo motor, `js/timer.js` (no hay un `temporizador.js` aparte: ya cumplía el papel). Modos `down` (cuenta regresiva), `up` (cronómetro) y `phases` (fases con nombre y duración: trote por intervalos y rondas de artes marciales). Todo se calcula contra `Date.now()`, nunca sumando segundos; el estado en curso vive en `localStorage['arise.timer']`. Al volver a la app (`visibilitychange`) se recalcula (`recalcular()`); un temporizador que venció con la app cerrada avisa su fin una vez con `late: true` y sin sonido (por ejemplo, tilda el ejercicio o suma los minutos de lectura).
- Pantalla encendida con Wake Lock (try/catch), sonido por Web Audio generado por código (pitidos y `campana`) con `resume()` tras un gesto, vibración solo si existe `navigator.vibrate` (el iPhone no vibra: no prometerla en textos).
- Fases: `{ label, ms, round?, rounds?, warn?, in?, out? }`. `warn` avisa cuando faltan esos ms; `in/out: 'campana'` suena al empezar o terminar la fase.
- Descanso entre series: arranca solo al marcar una serie (no la última) si "Descanso automático" (`S.ajustes.descansoAuto`, por defecto activo) está encendido; en la barra: −15 s, +15 s y Saltar. Valor por defecto según el tipo (`DESCANSO` en `data.js`: compuestos 120 s, accesorios 90 s, aislamiento y calistenia 60 s), editable por ejercicio en Rutinas.
- Ejercicios con tiempo: preajustes de duración (30 s a 20 min), Iniciar, Pausar, Reiniciar; al terminar, sonido y tilde automático.
- Tilde automático: un ejercicio se tilda solo al marcar la última serie o al terminar su temporizador; el aviso de unos 5 s trae "Deshacer" (`ctx.commit(accion)`), que revierte el tilde y, como el XP se calcula desde el registro, también su XP. El tilde manual sigue siempre.
- Rondas (sparring): `prefs.spar = { rounds, dur, rest, pre, warn }` (opcional); presets Kickboxing 3 × 2:00 y Boxeo 3 × 3:00 con descanso de 1:00, o personalizado; cuenta previa de 10 s y aviso a los 10 s finales. Al guardar, `spar.log[]` suma `dur` y `rest`, y `log[fecha].ex.spar` suma `rondas`, `dur` y `rest` (campos opcionales y aditivos; el esquema sigue en v4).

## Módulos activables
- Los módulos son `gym`, `cal`, `trote`, `comida`, `lectura` y `artes` (`MODULOS` en `data.js`). Apagar uno **solo lo oculta**: no borra datos, XP ni historial, y el XP, el nivel y la racha de días pasados no cambian (se calculan desde `log[fecha].f`, comida y lectura, sin mirar los módulos). Siempre queda al menos uno activo.
- Qué se oculta: Estado (tarjetas de proteína y lectura, "Hoy" y "Esta semana" si no hay Misión, cinturón y examen sin `artes`), la barra inferior (Comida y Lectura; Misión solo si gym, cal, trote y artes están todos apagados), Más (Plan y Rutinas sin Misión; Diario de sparring sin `artes`; Historial de trote sin `trote`) y Plan (las rutinas de un módulo apagado no se ofrecen; si un día ya tiene una, se ve bloqueada). Las pantallas de un módulo apagado redirigen a Estado.
- Misión y racha: cada rutina pertenece a un módulo (`modOf`). **Hoy y los días futuros**: si la rutina planificada es de un módulo apagado, ese día no tiene sesión (Misión muestra "Hoy no tenés rutina" con las rutinas activas para elegir). Si hoy ya tiene registro, esa sesión se sigue mostrando y su XP cuenta. **Días pasados**: intactos (están congelados). La racha no se pausa por apagar módulos: un día sin sesión completa la corta como siempre, salvo los descansos planificados (el descanso no tiene módulo, así que sigue valiendo). Comida y lectura siguen sumando su XP aunque estén ocultas.
- Primera vez: `views/inicio.js` pide elegir módulos y después ejemplo / vacío / importar; el ejemplo se guarda completo y los módulos apagados solo lo ocultan.

## Dibujado sin parpadeo
- `ctx.refresh()` vuelve a ejecutar la vista de la pantalla actual, pero `js/morph.js` aplica el HTML por diferencias sobre `#view`: los nodos que no cambian se conservan (foco, scroll, valores a medio escribir). La primera asignación de `innerHTML` tras navegar (`pantallaNueva`) reemplaza todo; las siguientes, incluidos los redibujos internos de una vista, se aplican por diferencias. Al reutilizar un nodo se sueltan sus listeners para que la vista enlace los nuevos: las vistas deben volver a enlazar todo después de cada `innerHTML`.

## Protección de datos
- Si lo guardado tiene un esquema mayor al de este código (`v > SCHEMA`), `store.js` no sobrescribe nada: `save()` no escribe y se muestra `views/bloqueo.js` (con descarga de lo guardado). Si el JSON está dañado se copia a `arise.v1.corrupto` antes de seguir. Antes de migrar se guarda `arise.v1.bak<versión>` y antes de importar una copia, `arise.v1.preimport`. Los campos nuevos opcionales (`mods`, `dojo.nombre/logo`, `mod` en rutinas) son aditivos y no suben el esquema.

## Reglas de XP
- Ejercicio hecho: `ex.xp` (25 normal, 15-40 cardio, 60 clase, 80 sparring, 40 descanso).
- Sesión completa (todos los no opcionales): `bonus` de la sesión.
- Nivel = floor(sqrt(xp/60)) + 1. Racha = días con sesión completa; un descanso planificado no marcado no corta la racha.
- Comida: +30 XP por día con proteína ≥ 90 % de la meta de ese día. Lectura: +20 XP por día con páginas ≥ meta y +100 XP por libro terminado. Se calculan desde el registro (`foodXP`, `readXP`), suman a `totalXP()` pero no cuentan para la racha ni la sesión completa.
- Trote: además de `ex.xp` (40), +1 XP por cada 2 min por encima de 20, tope +20 (`runBonus`). Solo cuenta si la sesión del día incluye el trote.
- **Sin penalizaciones.** Descansar suma XP. El usuario tiende a comer poco: la alerta de proteína baja (V2) debe ser amable.

## Cómo extender
- Nuevo ejercicio base (para todos): agregar en `EX` (`E(id, nombre, {...})`). Tipos: `sets`, `timed`, `check`. Los del usuario se crean desde la app (Más → Rutinas) y no tocan `data.js`.
- Rutinas: las edita el usuario en `#/rutinas`; `SESS` y `DEFAULT_PLAN` solo son el ejemplo con el que arranca una instalación nueva o migrada. Leer ejercicios con `defOf(id)` / `exFor(fecha, id)` y la sesión de un día con `sesionDia(fecha)`, nunca de `EX`/`SESS` directo.
- Diálogos: `abrirModal` (`js/modal.js`); con `form: true` no cierra al tocar afuera y acepta `botones` propios.
- Nueva pantalla: crear `js/views/x.js` con `render(root, ctx, arg)` (puede devolver una función de limpieza), registrarla en `VIEWS` y en `nav` de `app.js`.
- `ctx.commit()` después de cambiar progreso (calcula y muestra +XP / subida de nivel). `ctx.refresh()` re-renderiza.
- Al agregar archivos nuevos, sumarlos a `CORE` en `sw.js` y subir `V`.
- Instalación: `instalar.js` guarda el evento `beforeinstallprompt`; la tarjeta de Estado se puede descartar (`arise.instalar`) y la entrada de Más queda. Todo se oculta si la app ya corre instalada (`display-mode: standalone`). Sin el evento (iOS, Firefox, otros) muestra instrucciones según el navegador detectado; solo incluir pasos que existan de verdad.
- iOS (iPhone/iPad, PWA desde iOS 16.4): no hay `beforeinstallprompt`; `instalar.js` detecta iOS (también iPadOS como Mac táctil) y muestra los pasos de Safari (Compartir → Agregar a inicio) o pide abrir en Safari si es otro navegador. Metadatos `apple-*` e ícono 180×180 sin transparencia (`icons/apple-touch-icon.png`) en `index.html`. `navigator.vibrate` no existe en iOS: el fin de temporizador debe apoyarse en sonido y efecto visual, y ningún texto promete vibración. El sonido (Web Audio) puede quedar silenciado por el interruptor de silencio del iPhone. Al iniciar se pide `navigator.storage.persist()`. Los campos de texto usan 16 px en iOS para evitar el zoom al enfocar. No hay pruebas automáticas en WebKit/iPhone: probar a mano en un dispositivo real.
- Ejercicio con pantalla propia: crear `js/views/x.js` y registrarlo en `SPECIAL` de `app.js` (clave = id del ejercicio).
- Temporizador por fases: `T.startPhases([{label, ms, round?, rounds?, warn?}], meta)`. `meta.kind` ('ex', 'read', 'run', 'spar') decide qué hace `app.js` al terminar; `meta.exId` oculta la barra global en esa pantalla.
- **Regla permanente:** en cada entrega, subir `APP_VERSION` según la sección "Versionado" y agregar su entrada arriba en `js/novedades.js`, escrita para el usuario final (3 a 5 viñetas, lenguaje simple). La ventana aparece una sola vez por versión. Lógica en `js/aviso.js`: instalación nueva = sin registros ni copias `arise.v1.bak*` (no se muestra); con datos y sin `arise.seen` cuenta como `0.0.0` (se muestra); las versiones se comparan como números (`cmpVer`). Más → Novedades permite volver a ver la última.

## Estado de imágenes
- Emblemas de sección y músculos de Dorsales, Hombros, Deltoide posterior, Pecho y Bíceps: **hechos con Gemini/ChatGPT** (calidad final).
- **Provisionales** (hechos por composición sobre las figuras base, a reemplazar): `sec-lectura`, `mus-core`, `mus-cuadriceps`, `mus-isquios`, `mus-agarre`.
- **Faltante**: Pantorrillas. Hoy `MUS.pantorrillas` apunta a `img/sec-gym.webp`; al tener `img/mus-pantorrillas.webp`, cambiar la ruta en `js/data.js`. Se pide a Gemini: vista trasera de piernas completas con las pantorrillas resaltadas, mismo estilo que los demás.
- Convertir nuevas imágenes a WebP (≈512 px emblemas, ≈720 px músculos, calidad 80) para mantener la app liviana.

## Versionado
`APP_VERSION` (en `js/data.js`) usa **MAYOR.MENOR.PARCHE**:
- **Parche**: correcciones sin funciones nuevas.
- **Menor**: cada entrega de funciones dentro de una fase.
- **Mayor**: una fase completa nueva o un cambio que altere cómo se usa la app.

| Entrega | Versión |
|---|---|
| V1 | 1.0.0 |
| V2a | 2.0.0 |
| V2b | 2.1.0 |
| Arreglo de novedades | 2.1.1 |
| V2c | 2.2.0 |
| V3 | 3.0.0 |

El `v` del esquema de datos (`localStorage`) es **independiente** de `APP_VERSION`: solo sube cuando cambia la forma de los datos guardados y se migra en `load()`.

En cada entrega: subir `APP_VERSION` según esta regla y agregar su entrada arriba en `js/novedades.js`.

## Pendiente y hoja de ruta
**Datos por confirmar con el usuario**
- Plan base: Lunes/Martes/Jueves Dojo, Miércoles Gym 1, Viernes Sparring, Sábado Gym 2, Domingo Descanso (supuesto, editable).
- Series, repeticiones y pesos de Gym 2 (peso muerto rumano, sentadilla dividida, puente) son estimados.
- Pesos de Gym 1 conocidos: curl 12 kg, laterales 10 kg, banca 15 kg, press militar 12 kg por lado (subir a 14 con 8 limpias), remo 16 kg (probó 21 kg), farmer's walk 12 kg por lado × 50 m. Meta general: 87 kg, abdomen marcado, ~2.600 kcal, ~180 g de proteína.

**V2a (hecha)**
- Comida: proteína del día contra meta (180 g), alimentos rápidos editables, aviso amable, gráfico de 7 días, XP.
- Lectura: libros, páginas del día, estimación de días, cronómetro "Leer 20 min" (kind `read`), XP.
- Navegación de 5 ítems; tarjetas de proteína y lectura en Estado y Misión.

**V2b (hecha, v2.1.0)**
- Trote continuo e intervalos (1:1×10, 2:1×8, 3:1×6, personalizado) con registro de km y sensación; historial.
- Sesión Calistenia (elegible en Plan y Misión; no está en el plan base). Plancha es `timed` con `step` de 15 s.
- Clase en el dojo con tipo, esfuerzo y notas; asistencias de semana y mes.
- Sparring: rondas 3 min + 1 min de descanso con aviso a los 10 s; diario editable; "A trabajar" arriba en Misión el día de sparring.
- Barra de 5 ítems (Estado, Misión, Comida, Lectura, Más); `#/mas` lleva a Plan, Diario, Historial de trote, Ajustes y Novedades.
- Ventana de novedades y versión de la app (Estado → Ajustes).

**V2c (hecha, v2.2.0)**
- Rutinas y ejercicios editables (`#/rutinas`): crear, duplicar, renombrar, color, eliminar (con reemplazo en el plan), agregar/quitar/ordenar ejercicios, ejercicios propios, restaurar valores originales.
- Historial congelado por día (esquema v4).
- Sugerencia de peso en ejercicios con series: si la última vez se completaron todas las series en el tope de repeticiones, propone subir `inc` kg (2,5 por defecto; 1 en laterales y curl) con botón "Aplicar".
- Primera vez: elegir rutina de ejemplo o empezar vacío.
- Pendiente menor: la racha de días pasados sin registro depende del plan vigente para reconocer descansos planificados.

**2.2.1 (hecha)**
- Módulos activables (selector en la primera vez y en Ajustes), nombre y logo del dojo configurables, emblema genérico del dojo, dibujado por diferencias sin parpadeo y protección ante datos de una versión más nueva.

**2.2.2 (hecha)**
- Temporizadores completos: descanso automático con −15 s / +15 s / Saltar y ajuste global, ejercicios con tiempo con preajustes y Reiniciar, tilde automático con Deshacer, rondas de artes marciales con presets, cuenta previa y campana, y aviso de fin tras reabrir la app.

**V3**
- Cuerpo: peso, medidas y fotos de progreso (IndexedDB) con gráficos simples.
- Atributos de peleador: Pegada, Guardia, Movilidad, Recuperación (derivados del registro).
- Rangos de cinturón con hitos y examen; historial y calendario.
- Mejorar el aviso de fin de temporizador (limitado: con el celular bloqueado, el sonido puede no funcionar en una web app sin servidor, y iOS no tiene vibración).

## Pruebas
- Servir con `python3 -m http.server` y probar en viewport móvil (390×844) y escritorio. Revisar consola sin errores, offline (service worker) y persistencia al recargar.
